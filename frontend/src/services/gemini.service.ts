/**
 * Gemini AI Service
 * Professional, enterprise-grade AI service for financing recommendations
 *
 * Features:
 * - RAG (Retrieval-Augmented Generation) pipeline
 * - Cost estimation
 * - Financing recommendations
 * - Comprehensive analysis
 * - Robust error handling
 * - Fallback mechanisms
 *
 * @module services/gemini.service
 */

import {
  ChatMessage,
  GeminiResponse,
  CostEstimate,
  FinancingRecommendation,
  RAGAnalysisResult,
  FormData
} from '../types/financing.types';
import { AI_CONFIG } from '../constants/financing.constants';
import {
  cleanJsonResponse,
  generateFallbackCostEstimate
} from '../utils/financing.utils';

// ============================================================================
// Knowledge Base
// ============================================================================

const GERMAN_FINANCING_KNOWLEDGE_BASE = `
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

Provide helpful, accurate information based on this knowledge. Be friendly and encouraging.
`;

// ============================================================================
// Gemini Service Class
// ============================================================================

class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    this.baseUrl = AI_CONFIG.API_BASE_URL;
    this.model = AI_CONFIG.GEMINI_MODEL;

    if (!this.apiKey) {
      console.warn('Gemini API key not configured. Set REACT_APP_GEMINI_API_KEY in .env file');
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Check if service is properly configured
   */
  public isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Send a message to Gemini AI
   * @param userMessage - Message to send
   * @param conversationHistory - Previous messages
   * @returns AI response text
   */
  public async sendMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    const fullPrompt = this.buildConversationPrompt(userMessage, conversationHistory);
    const apiUrl = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: AI_CONFIG.GENERATION_CONFIG
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Generate cost estimate using AI
   * @param formData - User's project data
   * @returns Cost estimate with breakdown
   */
  public async generateCostEstimate(formData: FormData): Promise<CostEstimate> {
    try {
      const prompt = this.buildCostEstimatePrompt(formData);
      const response = await this.sendMessage(prompt);

      console.log('[AI Service] Raw cost estimate response:', response);

      const cleanedJson = cleanJsonResponse(response);
      const result = JSON.parse(cleanedJson);

      console.log('[AI Service] Parsed cost estimate:', result);
      return result;
    } catch (error) {
      console.error('[AI Service] Cost estimation failed:', error);
      return generateFallbackCostEstimate(formData.estimatedBudget);
    }
  }

  /**
   * Generate financing recommendations using AI
   * @param formData - User's project data
   * @param costEstimate - Estimated project cost
   * @returns Prioritized financing recommendations
   */
  public async generateFinancingRecommendations(
    formData: FormData,
    costEstimate: number
  ): Promise<FinancingRecommendation[]> {
    try {
      const prompt = this.buildRecommendationsPrompt(formData, costEstimate);
      const response = await this.sendMessage(prompt);

      console.log('[AI Service] Raw recommendations response:', response);

      const cleanedJson = cleanJsonResponse(response);
      const recommendations = JSON.parse(cleanedJson);

      // Sort by priority
      const sorted = recommendations.sort((a: any, b: any) => a.priority - b.priority);
      console.log('[AI Service] Parsed recommendations:', sorted);

      return sorted;
    } catch (error) {
      console.error('[AI Service] Recommendations failed:', error);
      return this.getFallbackRecommendations(formData);
    }
  }

  /**
   * Perform comprehensive RAG analysis
   * Combines cost estimation, recommendations, and summary
   * @param formData - User's project data
   * @returns Complete analysis result
   */
  public async performComprehensiveAnalysis(
    formData: FormData
  ): Promise<RAGAnalysisResult> {
    console.log('[AI Service] Starting comprehensive RAG analysis...');

    // Step 1: Generate cost estimate
    const costEstimate = await this.generateCostEstimate(formData);

    // Step 2: Generate financing recommendations
    const recommendations = await this.generateFinancingRecommendations(
      formData,
      costEstimate.totalEstimatedCost
    );

    // Step 3: Generate summary and next steps
    const { summary, nextSteps } = await this.generateSummary(
      formData,
      costEstimate,
      recommendations
    );

    console.log('[AI Service] Comprehensive analysis complete');

    return {
      costEstimate,
      recommendations,
      summary,
      nextSteps
    };
  }

  /**
   * Generate document checklist
   * @param renovationType - Type of renovation
   * @param ownership - Owner or renter
   * @param energyEfficiency - Energy efficiency focus
   * @returns List of required documents
   */
  public async generateDocumentChecklist(
    renovationType: string,
    ownership: string,
    energyEfficiency: string
  ): Promise<string[]> {
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
      const items = response
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return trimmed.match(/^\d+\.|^-|^•/) && trimmed.length > 3;
        })
        .map(line => line.replace(/^\d+\.\s*|^-\s*|^•\s*/, '').trim())
        .filter(item => {
          return (
            item.length > 5 &&
            !item.toLowerCase().startsWith('here') &&
            !item.toLowerCase().startsWith('okay')
          );
        });

      return items.length > 0 ? items : [response];
    } catch (error) {
      console.error('[AI Service] Checklist generation failed:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Build conversation prompt with history
   */
  private buildConversationPrompt(
    userMessage: string,
    conversationHistory: ChatMessage[]
  ): string {
    let fullPrompt = GERMAN_FINANCING_KNOWLEDGE_BASE + '\n\n';

    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    });

    fullPrompt += `User: ${userMessage}\nAssistant:`;
    return fullPrompt;
  }

  /**
   * Build cost estimation prompt
   */
  private buildCostEstimatePrompt(formData: FormData): string {
    return `As a German renovation cost expert, analyze this project and provide a DETAILED cost estimate in JSON format.

PROJECT DATA:
- Renovation Type: ${formData.renovationType}
- Property Type: ${formData.propertyType}
- Property Size: ${formData.propertySize || 'Not specified'} sqm
- Current Condition: ${formData.propertyCondition || 'Average'}
- Location: ${formData.location || 'Germany'}
- Estimated Budget: €${formData.estimatedBudget}
- Energy Efficiency Planned: ${formData.energyEfficiency}
- Timeline: ${formData.renovationDuration || 'Not specified'}

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
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(formData: FormData, costEstimate: number): string {
    return `As a German financing expert, analyze this complete project profile and recommend the BEST financing options, sorted by priority.

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
5. MUST include valid applicationUrl for each option

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
    "applicationSteps": ["Contact a certified energy consultant from the official BAFA list", "Energy consultant creates detailed renovation plan and iSFP", "Apply for KfW 261 through your bank BEFORE starting any work", "Bank processes application and approves financing", "Complete renovation work with certified contractors", "Energy consultant verifies completion", "Submit completion certificate to KfW for grant disbursement"],
    "matchScore": 95,
    "applicationUrl": "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Bundesf%C3%B6rderung-f%C3%BCr-effiziente-Geb%C3%A4ude-Wohngeb%C3%A4ude-Kredit-(261)/"
  }
]

IMPORTANT APPLICATION URLS:
- KfW 261: https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Bundesf%C3%B6rderung-f%C3%BCr-effiziente-Geb%C3%A4ude-Wohngeb%C3%A4ude-Kredit-(261)/
- KfW 262: https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Bundesf%C3%B6rderung-f%C3%BCr-effiziente-Geb%C3%A4ude-Wohngeb%C3%A4ude-Zuschuss-(262)/
- KfW 358/359: https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Erg%C3%A4nzungskredit-(358-359)/
- KfW 455-B: https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Altersgerecht-Umbauen-Investitionszuschuss-Barrierereduzierung-(455-B)/
- BAFA Heating: https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html

Include 3-5 best options from: KfW programs (261, 262, 358, 455-B), BAFA subsidies, regional programs, and standard bank loans.
Sort by priority: 1=HIGHEST (grants/subsidies first), then favorable loans, then standard loans.
Match score 0-100 based on how well the option fits this specific user's profile.
Provide detailed step-by-step application process (7-10 steps) for each option.`;
  }

  /**
   * Generate summary and next steps
   */
  private async generateSummary(
    formData: FormData,
    costEstimate: CostEstimate,
    recommendations: FinancingRecommendation[]
  ): Promise<{ summary: string; nextSteps: string[] }> {
    const prompt = `Based on this complete analysis:
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

    try {
      const response = await this.sendMessage(prompt);
      console.log('[AI Service] Raw summary response:', response);

      const cleanedJson = cleanJsonResponse(response);
      return JSON.parse(cleanedJson);
    } catch (e) {
      console.warn('[AI Service] Summary generation failed, using fallback');
      return {
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
  }

  /**
   * Get fallback recommendations when AI fails
   */
  private getFallbackRecommendations(formData: FormData): FinancingRecommendation[] {
    const isEnergyEfficient = formData.energyEfficiency === 'yes';

    return [
      {
        name: isEnergyEfficient
          ? 'KfW 261 - Energy Efficient Renovation'
          : 'Standard Bank Renovation Loan',
        type: isEnergyEfficient ? 'subsidy' : 'loan',
        priority: 1,
        maxAmount: isEnergyEfficient ? '€150,000' : '€100,000',
        interestRate: isEnergyEfficient ? '0.01% - 1.5%' : '3% - 6%',
        eligibility: 'Based on your project profile',
        pros: [
          isEnergyEfficient ? 'Low interest rates' : 'Flexible use',
          isEnergyEfficient ? 'Can combine with grants' : 'Quick approval',
          'Long repayment terms'
        ],
        cons: [
          isEnergyEfficient ? 'Requires energy consultant' : 'Higher interest than KfW',
          'Credit check required'
        ],
        applicationSteps: [
          'Check your SCHUFA score at www.meineschufa.de',
          'Gather required documents (ID, income proof, property documents)',
          isEnergyEfficient ? 'Contact a certified energy consultant' : 'Contact your bank',
          isEnergyEfficient ? 'Apply through your bank for KfW 261' : 'Submit loan application',
          isEnergyEfficient ? 'Complete work with certified contractors' : 'Await approval',
          isEnergyEfficient ? 'Submit completion certificate' : 'Receive funds'
        ],
        matchScore: 80,
        applicationUrl: isEnergyEfficient
          ? 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Bundesf%C3%B6rderung-f%C3%BCr-effiziente-Geb%C3%A4ude-Wohngeb%C3%A4ude-Kredit-(261)/'
          : 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/'
      }
    ];
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const geminiService = new GeminiService();
export type { ChatMessage };
