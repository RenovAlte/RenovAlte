/**
 * Utility to map Project data to Financing form data
 * This allows pre-filling the financing questionnaire with data from an existing project
 */

import { Project } from '../services/projects';
import { FormData } from '../types/financing.types';
import { DEFAULT_FORM_DATA } from '../constants/financing.constants';

/**
 * Maps project type from Project model to Financing module format
 * Since both forms now use the same PROJECT_TYPES, this is a direct 1:1 mapping
 */
const mapProjectType = (projectType: string): string => {
  // Direct pass-through - both forms use identical project types
  return projectType;
};

/**
 * Maps budget number to budget range string
 */
const mapBudgetToRange = (budget: number | null): string => {
  if (!budget || budget === 0) return '';

  if (budget < 10000) return 'under-10k';
  if (budget < 30000) return '10k-30k';
  if (budget < 50000) return '30k-50k';
  if (budget < 100000) return '50k-100k';
  return 'over-100k';
};

/**
 * Maps state abbreviation or name to Financing module format
 */
const mapState = (state: string | undefined): string => {
  if (!state) return '';

  // If already in correct format (lowercase abbreviation), return it
  const lowercaseState = state.toLowerCase().trim();

  // Map common state names to abbreviations
  const stateMapping: Record<string, string> = {
    'baden-württemberg': 'bw',
    'bavaria': 'by',
    'bayern': 'by',
    'berlin': 'be',
    'brandenburg': 'bb',
    'bremen': 'hb',
    'hamburg': 'hh',
    'hesse': 'he',
    'hessen': 'he',
    'mecklenburg-vorpommern': 'mv',
    'lower saxony': 'ni',
    'niedersachsen': 'ni',
    'north rhine-westphalia': 'nw',
    'nrw': 'nw',
    'nordrhein-westfalen': 'nw',
    'rhineland-palatinate': 'rp',
    'rheinland-pfalz': 'rp',
    'saarland': 'sl',
    'saxony': 'sn',
    'sachsen': 'sn',
    'saxony-anhalt': 'st',
    'sachsen-anhalt': 'st',
    'schleswig-holstein': 'sh',
    'thuringia': 'th',
    'thüringen': 'th'
  };

  return stateMapping[lowercaseState] || lowercaseState;
};

/**
 * Main function to map Project to Financing FormData
 * Pre-fills fields that match between Project and Financing questionnaire
 *
 * @param project - The selected project from Home page
 * @returns FormData with pre-filled values from project
 */
export const mapProjectToFinancingForm = (project: Project): FormData => {
  // Start with default form data
  const formData: FormData = { ...DEFAULT_FORM_DATA };

  // Map project fields to financing form fields
  if (project.project_type) {
    formData.renovationType = mapProjectType(project.project_type);
  }

  if (project.budget) {
    formData.estimatedBudget = mapBudgetToRange(project.budget);
  }

  // Map location data
  if (project.city) {
    // City is not a direct field in FormData, but we can note it for context
    // It could be used in additional_information or parsed later
  }

  if (project.state) {
    formData.location = mapState(project.state);
  }

  // Default ownership to 'yes' since they created a project
  // (assumption: if creating a project, they likely own it)
  formData.ownership = 'yes';

  // Determine if energy efficiency based on project type
  // Types that are typically energy-related
  const energyRelatedTypes = ['electrical', 'hvac', 'plumbing', 'windows_doors', 'roofing'];
  if (project.project_type && energyRelatedTypes.includes(project.project_type)) {
    formData.energyEfficiency = 'yes';
  }

  // Default property type to 'house' (can be improved with more project data)
  formData.propertyType = 'house';

  // Parse additional information for more details if available
  if (project.additional_information) {
    // You could add logic here to parse additional_information
    // and extract more details if users commonly put them there
  }

  return formData;
};

/**
 * Check if a project has enough data to pre-fill the form
 * @param project - The project to check
 * @returns true if project has minimum required data
 */
export const hasMinimumProjectData = (project: Project | null): boolean => {
  if (!project) return false;
  return !!(project.project_type); // At minimum, we need project type
};

/**
 * Get a user-friendly message about what was auto-filled
 * @param project - The project that was used for auto-fill
 * @returns Friendly message to show to user
 */
export const getAutoFillMessage = (project: Project): string => {
  const filledFields: string[] = [];

  if (project.project_type) filledFields.push('renovation type');
  if (project.budget) filledFields.push('budget');
  if (project.state) filledFields.push('location');

  if (filledFields.length === 0) {
    return 'Continue filling out the form for personalized recommendations.';
  }

  return `We've pre-filled ${filledFields.join(', ')} from your project "${project.name}". Please review and complete the remaining fields.`;
};
