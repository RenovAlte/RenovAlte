// Gemini AI Service for AI-powered financing assistance

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// Knowledge base about German financing options
const FINANCING_KNOWLEDGE_BASE = `
You are a helpful German home renovation financing advisor. You help users understand financing options for home renovations in Germany.

# Main Financing Options in Germany

## 1. Modernisierungskredit (Modernisation Loan)
- Personal loan for home renovations, usually unsecured
- Up to €50,000–€80,000
- Used for: Bathroom/kitchen upgrades, energy-efficient windows, heating, insulation

## 2. Baufinanzierung / Nachfinanzierung
- Mortgage-based financing
- For larger renovations and structural work
- Can extend existing mortgage or take a second one

## 3. KfW Förderkredite (State-Subsidised Loans)
- Low-interest loans via KfW Bank
- Distributed through local banks
- For: Energy-efficient renovations, renewable energy, barrier-free conversions

## 4. BAFA Zuschüsse (Cash Grants)
- Direct subsidies from BAFA
- For: Heating systems, renewable energy (heat pumps, solar thermal)
- No repayment required

# Key Programmes (2025)

## KfW Programme 261 / BEG WG
- Energy-efficient house renovations or partial upgrades
- Covers: Insulation, windows, heating
- Requirement: Apply before construction starts, energy consultant required
- Interest rate: 0.01% - 1.5%
- Max amount: €150,000

## KfW Programme 262 - BEG Renovation Grant
- Direct grant for energy-efficient renovations
- Up to €75,000 (up to 50% subsidy)
- No repayment needed
- Can be combined with loans

## KfW Programme 159 – Barrier-Free Conversion
- For accessibility improvements
- Bathrooms, stairs, ramps
- No energy efficiency requirement
- Up to €50,000

## BAFA "Heizen mit Erneuerbaren Energien"
- Renewable heating systems
- Heat pumps, biomass, solar thermal
- Up to 40% subsidy
- Max €70,000
- Apply directly via BAFA portal

# Required Documents

## For Bank Loans:
1. Personal identification: Passport or residence permit, Meldebescheinigung
2. Income proof: Last 3 salary slips, Einkommensteuerbescheid
3. Bank statements: Last 3 months
4. SCHUFA report: Credit score (check at meineschufa.de)
5. Property proof: Grundbuchauszug, property valuation
6. Renovation details: Kostenvoranschlag (cost estimate)
7. Energy certificate: Energieausweis (if applicable)

## For KfW/BAFA Subsidies:
1. Energy consultant report: From certified Energieeffizienz-Experte
2. Project plan: iSFP (individueller Sanierungsfahrplan)
3. Cost estimates: Contractor quotes
4. Energy calculations: Expected savings
5. Proof of ownership: Grundbuchauszug or Grundsteuerbescheid
6. Application forms: Via bank (KfW) or BAFA portal
7. Completion proof: Invoices and consultant confirmation (after renovation)

# Step-by-Step Process

1. Define renovation goals (which rooms, what improvements)
2. Contact an Energieberater (energy consultant) - required for subsidies
3. Collect contractor quotes (Kostenvoranschlag)
4. Visit bank or comparison portal for Modernisierungskredit
5. Submit documents (ID, income, SCHUFA, estimates)
6. Wait for approval BEFORE signing contracts
7. Execute renovation and keep all invoices
8. Submit proof to BAFA/KfW for subsidy disbursement

# Common Rejection Causes

- Applying AFTER starting renovation (subsidies require application before work begins)
- Missing energy consultant report for BEG programmes
- Incomplete cost breakdown
- Low SCHUFA score (below 90-95%)
- Non-eligible measures (painting, furniture, decorative work)
- Using unapproved contractors (some subsidies require certified Fachbetrieb)

# Important Tips

- ALWAYS apply before starting work for subsidies
- Energy consultant is mandatory for KfW/BAFA energy programmes
- Many grants can be combined with loans
- Check SCHUFA score first at meineschufa.de
- Keep detailed documentation of all work
- Use certified contractors (Fachbetrieb) when required
- Typical approval time: 2-6 weeks
- Interest rates vary based on credit score and property value

Provide helpful, accurate information based on this knowledge. Be friendly and encouraging.
`;

class GeminiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model: string = 'gemini-2.0-flash'; // Using Gemini 2.0 Flash (latest stable, free tier)

  constructor() {
    // API key should be stored in environment variables
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Gemini API key not found. Set REACT_APP_GEMINI_API_KEY in .env file');
    }
  }

  async sendMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file');
    }

    try {
      // Build conversation context for Gemini
      let fullPrompt = FINANCING_KNOWLEDGE_BASE + '\n\n';

      // Add conversation history
      conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
          fullPrompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `Assistant: ${msg.content}\n`;
        }
      });

      // Add current user message
      fullPrompt += `User: ${userMessage}\nAssistant:`;

      const apiUrl = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async generateDocumentChecklist(renovationType: string, ownership: string, energyEfficiency: string): Promise<string[]> {
    const prompt = `Create a concise document checklist for German home renovation financing.

Project details:
- Renovation type: ${renovationType}
- Ownership: ${ownership === 'yes' ? 'Owns the property' : 'Rents the property'}
- Energy efficiency focus: ${energyEfficiency}

IMPORTANT: Provide ONLY a clean, numbered list of document names. NO explanations, NO introductions, NO extra text, NO paragraphs.

Format each item exactly like this:
1. Personal Identification (Passport or Personalausweis)
2. Proof of Address (Meldebescheinigung)
3. Last 3 Salary Slips (Gehaltsabrechnungen)

Keep it SHORT and SIMPLE - just document names with German terms in parentheses.`;

    try {
      const response = await this.sendMessage(prompt);
      // Parse the response into an array of checklist items
      const items = response
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          // Only keep lines that start with numbers, dashes, or bullets
          return trimmed.match(/^\d+\.|^-|^•/) && trimmed.length > 3;
        })
        .map(line => {
          // Remove numbering/bullets and clean up
          return line.replace(/^\d+\.\s*|^-\s*|^•\s*/, '').trim();
        })
        .filter(item => {
          // Filter out any remaining explanatory text or empty items
          return item.length > 5 && !item.toLowerCase().startsWith('here') && !item.toLowerCase().startsWith('okay');
        });

      return items.length > 0 ? items : [response];
    } catch (error) {
      throw error;
    }
  }

  async getPersonalizedAdvice(formData: any): Promise<string> {
    const prompt = `A homeowner in Germany needs personalized advice for their renovation project:
- Renovation type: ${formData.renovationType}
- Budget: ${formData.estimatedBudget}
- Property type: ${formData.propertyType}
- Monthly income: ${formData.monthlyIncome}
- Owns property: ${formData.ownership}
- Energy efficiency focus: ${formData.energyEfficiency}

Provide specific, actionable advice about which financing options they should prioritize and what steps to take first. Be concise but helpful.`;

    try {
      return await this.sendMessage(prompt);
    } catch (error) {
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  // Helper function to clean and extract JSON from AI responses
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Extract JSON object or array
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    let jsonStr = jsonMatch[0];

    // Try to fix common issues
    try {
      // First attempt: parse as-is
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (e) {
      // Second attempt: fix unescaped quotes in descriptions
      // This is a simple fix - replace quotes in description values
      jsonStr = jsonStr.replace(
        /"description"\s*:\s*"([^"]*(?:"[^"]*)*[^"]*)"/g,
        (match, content) => {
          // Escape internal quotes
          const escaped = content.replace(/"/g, '\\"');
          return `"description": "${escaped}"`;
        }
      );

      try {
        JSON.parse(jsonStr);
        return jsonStr;
      } catch (e2) {
        // If still failing, throw the original error
        throw new Error(`JSON parsing failed: ${e2}`);
      }
    }
  }

  // RAG-Powered Cost Estimation with comprehensive analysis
  async generateCostEstimate(formData: any): Promise<{
    totalEstimatedCost: number;
    breakdown: Array<{ category: string; cost: number; description: string }>;
    contingency: number;
    explanation: string;
  }> {
    const prompt = `As a German renovation cost expert, analyze this project and provide a DETAILED cost estimate in JSON format.

PROJECT DATA:
- Renovation Type: ${formData.renovationType}
- Property Type: ${formData.propertyType}
- Property Size: ${formData.propertySize || 'Not specified'} sqm
- Current Condition: ${formData.propertyCondition || 'Average'}
- Location: ${formData.location || 'Germany'}
- Estimated Budget: €${formData.estimatedBudget}
- Energy Efficiency Planned: ${formData.energyEfficiency}
- Timeline: ${formData.timeline || 'Not specified'}

CRITICAL RULES:
1. Respond ONLY with valid JSON (no markdown, no code blocks, no extra text)
2. Do NOT use apostrophes or quotes inside description text
3. Use simple words without special characters

EXACT format:
{
  "totalEstimatedCost": 45000,
  "breakdown": [
    {"category": "Materials", "cost": 15000, "description": "High-quality materials and fixtures"},
    {"category": "Labor", "cost": 20000, "description": "Professional installation"},
    {"category": "Planning and Permits", "cost": 3000, "description": "Architect fees and permits"},
    {"category": "Contingency Reserve", "cost": 7000, "description": "Buffer for unexpected costs"}
  ],
  "contingency": 7000,
  "explanation": "Based on typical German renovation costs. Actual costs may vary by 15 percent."
}

Provide realistic German market prices for 2025. Include materials, labor, permits, and 15% contingency.`;

    try {
      const response = await this.sendMessage(prompt);
      console.log('Raw cost estimate response:', response);

      // Clean and parse JSON
      const cleanedJson = this.cleanJsonResponse(response);
      const result = JSON.parse(cleanedJson);

      console.log('Parsed cost estimate:', result);
      return result;
    } catch (error) {
      console.error('Error generating cost estimate:', error);

      // Return fallback cost estimate
      const budgetNum = parseInt(formData.estimatedBudget.replace(/[^0-9]/g, '')) || 50000;
      return {
        totalEstimatedCost: budgetNum,
        breakdown: [
          { category: "Materials", cost: Math.round(budgetNum * 0.35), description: "Building materials and fixtures" },
          { category: "Labor", cost: Math.round(budgetNum * 0.45), description: "Professional installation" },
          { category: "Planning & Permits", cost: Math.round(budgetNum * 0.05), description: "Permits and planning" },
          { category: "Contingency", cost: Math.round(budgetNum * 0.15), description: "Safety buffer (15%)" }
        ],
        contingency: Math.round(budgetNum * 0.15),
        explanation: "Estimated costs based on your budget. Actual costs may vary."
      };
    }
  }

  // RAG-Powered Financing Recommendations with Priority Sorting
  async generateFinancingRecommendations(formData: any, costEstimate: number): Promise<Array<{
    name: string;
    type: 'grant' | 'subsidy' | 'loan';
    priority: number;
    maxAmount: string;
    interestRate: string;
    eligibility: string;
    pros: string[];
    cons: string[];
    applicationSteps: string[];
    matchScore: number;
  }>> {
    const prompt = `As a German financing expert, analyze this complete project profile and recommend the BEST financing options, sorted by priority.

COMPLETE PROJECT PROFILE:
- Renovation Type: ${formData.renovationType}
- Property Type: ${formData.propertyType}
- Ownership: ${formData.ownership === 'yes' ? 'Owner' : 'Renter'}
- Monthly Income: €${formData.monthlyIncome}
- Estimated Total Cost: €${costEstimate}
- Budget Available: €${formData.estimatedBudget}
- Energy Efficiency: ${formData.energyEfficiency}
- Credit Score: ${formData.creditScore || 'Not specified'}
- Age: ${formData.age || 'Not specified'}
- Property Size: ${formData.propertySize || 'Not specified'} sqm

CRITICAL RULES:
1. Respond ONLY with valid JSON array (no markdown, no code blocks)
2. Do NOT use apostrophes or quotes inside text
3. Use simple words without special characters
4. Keep descriptions short and clear

EXACT format:
[
  {
    "name": "KfW 261 - Energy Efficient Renovation",
    "type": "subsidy",
    "priority": 1,
    "maxAmount": "60000 EUR per measure",
    "interestRate": "0.01 to 1.5 percent",
    "eligibility": "High match for energy renovation and property owners",
    "pros": ["Low interest rate", "Up to 45 percent grant", "Can combine with other programs"],
    "cons": ["Requires energy consultant", "Must apply before starting work"],
    "applicationSteps": ["Hire certified energy consultant", "Get energy plan", "Apply through bank before work starts", "Complete work with certified contractor", "Submit completion certificate"],
    "matchScore": 95
  }
]

Include 3-5 best options from: KfW programs (261, 262, 455-B), BAFA subsidies, regional programs, and standard bank loans.
Sort by priority: 1=HIGHEST (grants/subsidies first), then favorable loans, then standard loans.
Match score 0-100 based on how well the option fits this specific user's profile.`;

    try {
      const response = await this.sendMessage(prompt);
      console.log('Raw recommendations response:', response);

      // Clean and parse JSON
      const cleanedJson = this.cleanJsonResponse(response);
      const recommendations = JSON.parse(cleanedJson);

      // Sort by priority (lower number = higher priority)
      const sorted = recommendations.sort((a: any, b: any) => a.priority - b.priority);
      console.log('Parsed recommendations:', sorted);

      return sorted;
    } catch (error) {
      console.error('Error generating recommendations:', error);

      // Return fallback recommendations
      const isEnergyEfficient = formData.energyEfficiency === 'yes';
      return [
        {
          name: isEnergyEfficient ? "KfW 261 - Energy Efficient Renovation" : "Standard Bank Renovation Loan",
          type: isEnergyEfficient ? "subsidy" : "loan",
          priority: 1,
          maxAmount: isEnergyEfficient ? "€150,000" : "€100,000",
          interestRate: isEnergyEfficient ? "0.01% - 1.5%" : "3% - 6%",
          eligibility: "Based on your project profile",
          pros: [
            isEnergyEfficient ? "Low interest rates" : "Flexible use",
            isEnergyEfficient ? "Can combine with grants" : "Quick approval",
            "Long repayment terms"
          ],
          cons: [
            isEnergyEfficient ? "Requires energy consultant" : "Higher interest than KfW",
            "Credit check required"
          ],
          applicationSteps: [
            "Check your SCHUFA score",
            "Gather required documents",
            "Contact your bank",
            "Submit application"
          ],
          matchScore: 80
        }
      ];
    }
  }

  // Comprehensive RAG Analysis - combines everything
  async performComprehensiveAnalysis(formData: any): Promise<{
    costEstimate: any;
    recommendations: any[];
    summary: string;
    nextSteps: string[];
  }> {
    try {
      // Step 1: Generate cost estimate
      const costEstimate = await this.generateCostEstimate(formData);

      // Step 2: Generate financing recommendations based on cost
      const recommendations = await this.generateFinancingRecommendations(
        formData,
        costEstimate.totalEstimatedCost
      );

      // Step 3: Generate summary and next steps
      const summaryPrompt = `Based on this complete analysis:
- Total Project Cost: ${costEstimate.totalEstimatedCost} EUR
- User Monthly Income: ${formData.monthlyIncome}
- Top Recommendation: ${recommendations[0]?.name}

CRITICAL RULES:
1. Respond ONLY with valid JSON
2. Do NOT use apostrophes or quotes inside text
3. Keep it simple and clear

EXACT format:
{
  "summary": "Your best approach is to start with the top recommendation and prepare required documents",
  "nextSteps": ["Check credit score", "Get contractor quotes", "Contact consultant", "Prepare documents"]
}`;

      const summaryResponse = await this.sendMessage(summaryPrompt);
      console.log('Raw summary response:', summaryResponse);

      let summaryData;
      try {
        const cleanedJson = this.cleanJsonResponse(summaryResponse);
        summaryData = JSON.parse(cleanedJson);
      } catch (e) {
        console.warn('Failed to parse summary, using fallback');
        summaryData = {
          summary: `Based on your ${formData.renovationType} project with a budget of €${formData.estimatedBudget}, we recommend starting with ${recommendations[0]?.name || 'available financing options'}. This approach balances cost efficiency with your specific needs.`,
          nextSteps: [
            'Review the cost breakdown and financing recommendations below',
            'Check your SCHUFA credit score at meineschufa.de',
            'Gather contractor quotes for your renovation',
            'Contact an energy consultant if pursuing KfW/BAFA programs',
            'Apply for financing BEFORE starting any work'
          ]
        };
      }

      return {
        costEstimate,
        recommendations,
        summary: summaryData.summary,
        nextSteps: summaryData.nextSteps
      };
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw error;
    }
  }
}

export const openAIService = new GeminiService();
export type { ChatMessage };
