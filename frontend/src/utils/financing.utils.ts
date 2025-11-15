/**
 * Utility functions for the Financing module
 * Reusable helper functions for common operations
 */

import {
  FinancingOption,
  FormData,
  FinancingType,
  CostEstimate
} from '../types/financing.types';
import {
  FINANCING_TYPE_COLORS,
  FINANCING_TYPE_LABELS,
  MATCH_SCORE_COLORS,
  BUDGET_RANGES
} from '../constants/financing.constants';

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format number as Euro currency
 * @param amount - Number to format
 * @returns Formatted currency string (e.g., "€45,000")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Parse budget string to numeric value
 * @param budgetString - Budget range string (e.g., "30k-50k")
 * @returns Numeric budget value
 */
export const parseBudgetToNumber = (budgetString: string): number => {
  const budgetRange = BUDGET_RANGES[budgetString];
  return budgetRange ? budgetRange.default : 50000;
};

// ============================================================================
// Financing Matching Logic
// ============================================================================

/**
 * Filter financing options based on user criteria
 * @param options - All available financing options
 * @param formData - User's form data
 * @returns Filtered and sorted financing options
 */
export const matchFinancingOptions = (
  options: FinancingOption[],
  formData: FormData
): FinancingOption[] => {
  const matches = options.filter(option => {
    // Match by renovation type
    const typeMatch = option.renovationTypes.includes(formData.renovationType);

    // Match by income requirement
    const incomeMatch =
      option.incomeRequirement === 'all' ||
      (option.incomeRequirement === 'medium-low' &&
        ['low', 'medium-low', 'medium'].includes(formData.monthlyIncome)) ||
      (option.incomeRequirement === 'medium-high' &&
        ['medium', 'medium-high', 'high'].includes(formData.monthlyIncome));

    // Prioritize energy efficiency options if selected
    const energyMatch =
      formData.energyEfficiency === 'yes'
        ? option.renovationTypes.includes('energy-efficiency')
        : true;

    return typeMatch && incomeMatch && energyMatch;
  });

  // Sort by priority: grants first, then subsidies, then loans
  return sortByFinancingType(matches);
};

/**
 * Sort financing options by type priority
 * @param options - Financing options to sort
 * @returns Sorted financing options
 */
export const sortByFinancingType = (
  options: FinancingOption[]
): FinancingOption[] => {
  const typeOrder: Record<FinancingType, number> = {
    grant: 0,
    subsidy: 1,
    loan: 2
  };

  return [...options].sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
};

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Get color classes for financing type badge
 * @param type - Financing type
 * @returns Tailwind CSS classes
 */
export const getFinancingTypeColor = (type: FinancingType): string => {
  return FINANCING_TYPE_COLORS[type] || FINANCING_TYPE_COLORS.loan;
};

/**
 * Get label for financing type
 * @param type - Financing type
 * @returns Human-readable label
 */
export const getFinancingTypeLabel = (type: FinancingType): string => {
  return FINANCING_TYPE_LABELS[type] || type;
};

/**
 * Get color for match score
 * @param score - Match score (0-100)
 * @returns Tailwind CSS color class
 */
export const getMatchScoreColor = (score: number): string => {
  if (score >= 80) return MATCH_SCORE_COLORS.high;
  if (score >= 60) return MATCH_SCORE_COLORS.medium;
  return MATCH_SCORE_COLORS.low;
};

// ============================================================================
// Cost Calculation Helpers
// ============================================================================

/**
 * Generate fallback cost estimate based on budget
 * @param budgetString - Budget range string
 * @returns Cost estimate object
 */
export const generateFallbackCostEstimate = (
  budgetString: string
): CostEstimate => {
  const budgetNum = parseBudgetToNumber(budgetString);

  return {
    totalEstimatedCost: budgetNum,
    breakdown: [
      {
        category: 'Materials',
        cost: Math.round(budgetNum * 0.35),
        description: 'Building materials and fixtures'
      },
      {
        category: 'Labor',
        cost: Math.round(budgetNum * 0.45),
        description: 'Professional installation'
      },
      {
        category: 'Planning & Permits',
        cost: Math.round(budgetNum * 0.05),
        description: 'Permits and planning fees'
      },
      {
        category: 'Contingency',
        cost: Math.round(budgetNum * 0.15),
        description: 'Safety buffer (15%)'
      }
    ],
    contingency: Math.round(budgetNum * 0.15),
    explanation: 'Estimated costs based on your budget. Actual costs may vary.'
  };
};

/**
 * Calculate budget gap
 * @param totalCost - Total estimated cost
 * @param budget - User's available budget
 * @returns Budget difference (positive if over budget)
 */
export const calculateBudgetGap = (
  totalCost: number,
  budget: number
): number => {
  return totalCost - budget;
};

/**
 * Calculate budget coverage percentage
 * @param budget - User's available budget
 * @param totalCost - Total estimated cost
 * @returns Percentage of coverage (0-100+)
 */
export const calculateBudgetPercentage = (
  budget: number,
  totalCost: number
): number => {
  return totalCost > 0 ? (budget / totalCost) * 100 : 0;
};

// ============================================================================
// JSON Cleaning Utilities
// ============================================================================

/**
 * Clean and extract JSON from AI response
 * Removes markdown, fixes common issues
 * @param response - Raw AI response string
 * @returns Cleaned JSON string
 */
export const cleanJsonResponse = (response: string): string => {
  // Remove markdown code blocks
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Extract JSON object or array
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  let jsonStr = jsonMatch[0];

  // Try to parse and fix if needed
  try {
    JSON.parse(jsonStr);
    return jsonStr;
  } catch (e) {
    // Attempt to fix escaped quotes in descriptions
    jsonStr = jsonStr.replace(
      /"(description|summary|explanation)"\s*:\s*"([^"]*(?:\\"[^"]*)*[^"]*)"/g,
      (match, key, content) => {
        const escaped = content.replace(/(?<!\\)"/g, '\\"');
        return `"${key}": "${escaped}"`;
      }
    );

    try {
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (e2) {
      throw new Error(`JSON parsing failed: ${e2}`);
    }
  }
};

/**
 * Safely parse JSON with error handling
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export const safeJSONParse = <T>(
  jsonString: string,
  fallback: T
): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate if form has minimum required fields
 * @param formData - Form data to validate
 * @returns True if valid, false otherwise
 */
export const isFormValid = (formData: FormData): boolean => {
  return !!(
    formData.renovationType &&
    formData.estimatedBudget &&
    formData.propertyType &&
    formData.monthlyIncome &&
    formData.ownership &&
    formData.energyEfficiency
  );
};

/**
 * Check if a value is a valid number
 * @param value - Value to check
 * @returns True if valid number
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncate string to specified length
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string
 */
export const truncate = (str: string, length: number): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};
