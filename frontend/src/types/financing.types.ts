/**
 * Type definitions for the Financing module
 * Provides type safety across the application
 */

// ============================================================================
// Form Data Types
// ============================================================================

export interface FormData {
  // Step 1: Basic Project Info (Required)
  renovationType: string;
  estimatedBudget: string;
  propertyType: string;
  monthlyIncome: string;
  ownership: string;
  energyEfficiency: string;

  // Step 2: Property Details (Required for accurate analysis)
  propertySize?: string; // sqm
  propertyAge?: string; // Year built or age range
  propertyCondition?: 'excellent' | 'good' | 'average' | 'poor' | 'very-poor';
  location?: string; // Bundesland/State
  propertyUse?: 'owner-occupied' | 'rental' | 'mixed';
  residentialUnits?: string; // Number of units
  currentEnergyRating?: string; // A+ to H or unknown
  hasEnergyCertificate?: 'yes' | 'no' | 'unknown';

  // Step 3: Financial Information (Critical for eligibility)
  annualIncome?: string; // Critical for KfW 358/359
  availableSavings?: string; // Down payment capability
  existingDebts?: string; // Affects borrowing capacity
  monthlyDebtPayments?: string; // Debt obligations
  creditScore?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'; // SCHUFA
  employmentStatus?: 'permanent' | 'self-employed' | 'temporary' | 'retired' | 'unemployed' | 'other';
  hasCoApplicant?: 'yes-with-income' | 'yes-no-income' | 'no' | 'prefer-not-say';

  // Step 4: Energy & Technical Details (For BAFA/KfW programs)
  currentHeatingSystem?: string; // Type of heating
  heatingSystemAge?: '0-10' | '10-20' | 'over-20' | 'unknown';
  plannedEnergyMeasures?: string; // What improvements
  targetEfficiencyLevel?: string; // EH 40, 55, 70, etc.
  hasEnergyConsultant?: 'yes' | 'no-will-hire' | 'no-need-recommendation' | 'unknown';

  // Step 5: Timeline & Planning (Application requirements)
  projectStartTimeline?: 'ready' | 'need-quotes' | 'already-started' | 'already-completed' | 'planning-ahead';
  renovationDuration?: 'under-3-months' | '3-6-months' | '6-12-months' | '1-2-years' | 'over-2-years' | 'not-sure';
  hasContractorQuotes?: 'yes-multiple' | 'yes-one' | 'in-progress' | 'not-yet' | 'unknown';
  urgencyLevel?: 'emergency' | 'this-year' | 'next-6-12-months' | 'planning' | 'no-rush';

  // Step 6: Personal & Documentation (Eligibility verification)
  age?: string; // Primary applicant age range
  householdSize?: '1' | '2' | '3-4' | '5+';
  residenceStatus?: 'german-citizen' | 'eu-citizen' | 'permanent-resident' | 'blue-card' | 'temporary' | 'other';
  germanTaxResident?: 'yes-filed' | 'yes-not-filed' | 'no' | 'not-sure';
  hasSchufaReport?: 'yes' | 'no-will-order' | 'unknown';
  hasPropertyDocuments?: 'yes-all' | 'yes-partial' | 'no' | 'unknown';
  hasIncomeDocuments?: 'yes' | 'partial' | 'no' | 'self-employed';
  readyToApply?: 'ready-now' | '1-2-weeks' | '1-3-months' | 'researching' | 'not-sure';
}

// ============================================================================
// Financing Option Types
// ============================================================================

export type FinancingType = 'loan' | 'subsidy' | 'grant';

export interface FinancingOption {
  id: string;
  name: string;
  type: FinancingType;
  provider: string;
  description: string;
  eligibility: string[];
  interestRate?: string;
  maxAmount?: string;
  renovationTypes: string[];
  incomeRequirement?: string;
  link: string;
  advantages: string[];
}

// ============================================================================
// Cost Estimation Types
// ============================================================================

export interface CostBreakdownItem {
  category: string;
  cost: number;
  description: string;
}

export interface CostEstimate {
  totalEstimatedCost: number;
  breakdown: CostBreakdownItem[];
  contingency: number;
  explanation: string;
}

// ============================================================================
// AI Recommendation Types
// ============================================================================

export interface FinancingRecommendation {
  name: string;
  type: FinancingType;
  priority: number;
  maxAmount: string;
  interestRate: string;
  eligibility: string;
  pros: string[];
  cons: string[];
  applicationSteps: string[];
  matchScore: number;
  applicationUrl?: string; // Direct link to apply for this financing option
}

export interface RAGAnalysisResult {
  costEstimate: CostEstimate;
  recommendations: FinancingRecommendation[];
  summary: string;
  nextSteps: string[];
}

// ============================================================================
// AI Service Types
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// ============================================================================
// Form Option Types
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface CostCalculatorProps {
  totalEstimatedCost: number;
  breakdown: CostBreakdownItem[];
  contingency: number;
  explanation: string;
  userBudget: number;
}

export interface FinancingRecommendationsProps {
  recommendations: FinancingRecommendation[];
  summary: string;
  nextSteps: string[];
}

export interface DocumentChecklistProps {
  renovationType: string;
  ownership: string;
  energyEfficiency: string;
  estimatedBudget: string;
}

export interface FinancingAssistantProps {
  // Currently no props, but keeping for future extension
}
