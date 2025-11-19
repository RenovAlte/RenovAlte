import Heading from "../../components/Heading/Heading";
import React, { useState, useEffect } from "react";
import Text from "../../components/Text/Text";
import { Home, Euro, TrendingUp, CheckCircle2, ExternalLink, AlertCircle, Loader2, Sparkles, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import FinancingAssistant from "../../components/FinancingAssistant/FinancingAssistant";
import DocumentChecklist from "../../components/DocumentChecklist/DocumentChecklist";
import CostCalculator from "../../components/CostCalculator/CostCalculator";
import FinancingRecommendations from "../../components/FinancingRecommendations/FinancingRecommendations";

// Import ProjectContext to access selected project
import { useProject } from "../../contexts/ProjectContext";

// Import project to financing mapper
import { mapProjectToFinancingForm, hasMinimumProjectData, getAutoFillMessage } from "../../utils/projectToFinancingMapper";

// Import types from centralized file
import {
  FormData,
  RAGAnalysisResult,
  FinancingOption
} from '../../types/financing.types';

// Import constants - single source of truth
import {
  RENOVATION_TYPE_OPTIONS,
  BUDGET_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  INCOME_OPTIONS,
  FINANCING_OPTIONS,
  DEFAULT_FORM_DATA,
  // Step 2: Property Details
  PROPERTY_AGE_OPTIONS,
  PROPERTY_SIZE_OPTIONS,
  PROPERTY_CONDITION_EXTENDED_OPTIONS,
  GERMAN_STATES_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RESIDENTIAL_UNITS_OPTIONS,
  ENERGY_RATING_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
  // Step 3: Financial Information
  ANNUAL_INCOME_OPTIONS,
  AVAILABLE_SAVINGS_OPTIONS,
  EXISTING_DEBTS_OPTIONS,
  MONTHLY_DEBT_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  CO_APPLICANT_OPTIONS,
  // Step 4: Energy & Technical
  HEATING_SYSTEM_OPTIONS,
  HEATING_AGE_OPTIONS,
  PLANNED_MEASURES_OPTIONS,
  TARGET_EFFICIENCY_OPTIONS,
  ENERGY_CONSULTANT_OPTIONS,
  // Step 5: Timeline & Planning
  PROJECT_START_OPTIONS,
  RENOVATION_DURATION_OPTIONS,
  CONTRACTOR_QUOTES_OPTIONS,
  URGENCY_OPTIONS,
  // Step 6: Personal & Documentation
  AGE_OPTIONS,
  HOUSEHOLD_SIZE_OPTIONS,
  RESIDENCE_STATUS_OPTIONS,
  TAX_RESIDENT_OPTIONS,
  PROPERTY_DOCS_OPTIONS,
  DOCUMENT_READY_OPTIONS,
  READY_TO_APPLY_OPTIONS
} from '../../constants/financing.constants';

// Import utilities - reusable functions
import {
  matchFinancingOptions,
  getFinancingTypeColor,
  getFinancingTypeLabel,
  parseBudgetToNumber
} from '../../utils/financing.utils';

// Import clean AI service
import { geminiService } from '../../services/gemini.service';

const Financing: React.FC = () => {
  // Get selected project from context
  const { selectedProject } = useProject();

  const [mainStep, setMainStep] = useState<'form' | 'results'>('form');
  const [currentFormStep, setCurrentFormStep] = useState<number>(1); // Multi-step form: 1-6
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [matchedOptions, setMatchedOptions] = useState<FinancingOption[]>([]);

  // Auto-fill notification state
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);
  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);

  // RAG Analysis State
  const [ragAnalysis, setRagAnalysis] = useState<RAGAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const useAI = true; // AI is always enabled when configured

  // Form steps configuration
  const formSteps = [
    { number: 1, title: 'Basic Info', questions: 6 },
    { number: 2, title: 'Property Details', questions: 8 },
    { number: 3, title: 'Financial Info', questions: 7 },
    { number: 4, title: 'Energy & Technical', questions: 5 },
    { number: 5, title: 'Timeline', questions: 4 },
    { number: 6, title: 'Personal & Docs', questions: 8 }
  ];

  const totalSteps = formSteps.length;

  // Auto-fill form from selected project on component mount
  useEffect(() => {
    if (hasMinimumProjectData(selectedProject)) {
      console.log('Auto-filling financing form from project:', selectedProject);

      // Map project data to financing form
      const preFilledData = mapProjectToFinancingForm(selectedProject!);
      setFormData(preFilledData);

      // Show notification to user
      const message = getAutoFillMessage(selectedProject!);
      setAutoFillMessage(message);
      setShowAutoFillBanner(true);

      // Auto-hide banner after 10 seconds
      const timer = setTimeout(() => {
        setShowAutoFillBanner(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [selectedProject]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Multi-step navigation
  const handleNextStep = () => {
    if (currentFormStep < totalSteps) {
      setCurrentFormStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentFormStep > 1) {
      setCurrentFormStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentFormStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const findMatchingOptions = () => {
    // Use utility function instead of inline logic
    const matches = matchFinancingOptions(FINANCING_OPTIONS, formData);
    setMatchedOptions(matches);
    setMainStep('results');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if AI is enabled and configured
    if (useAI && geminiService.isConfigured()) {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        console.log('Starting AI analysis with RAG pipeline...');
        const analysis = await geminiService.performComprehensiveAnalysis(formData);
        console.log('Analysis complete:', analysis);

        setRagAnalysis(analysis);
        setMainStep('results');
      } catch (error) {
        console.error('AI Analysis failed:', error);
        setAnalysisError(
          error instanceof Error
            ? error.message
            : 'Failed to generate AI analysis. Showing basic results instead.'
        );

        // Fallback to basic matching
        findMatchingOptions();
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // Use basic matching if AI is disabled or not configured
      findMatchingOptions();
    }
  };

  const resetForm = () => {
    setMainStep('form');
    setCurrentFormStep(1); // Reset to first step
    setFormData(DEFAULT_FORM_DATA); // Use constant
    setMatchedOptions([]);
    setRagAnalysis(null);
    setAnalysisError(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Heading level={1}>Financing Your Renovation</Heading>
        <Text className="text-gray-600 mt-2">
          Find the best loans, subsidies, and grants for your renovation project based on your specific needs and financial situation.
        </Text>
      </div>

      {mainStep === 'form' ? (
        /* Multi-Step Questionnaire Form */
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Auto-fill notification banner */}
          {showAutoFillBanner && autoFillMessage && selectedProject && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm animate-slideDown">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-emerald-100 p-2 rounded-full flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                      Project Data Auto-Filled
                    </h4>
                    <p className="text-sm text-emerald-800">
                      {autoFillMessage}
                    </p>
                    <p className="text-xs text-emerald-700 mt-2">
                      From project: <span className="font-medium">{selectedProject.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAutoFillBanner(false)}
                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-100 transition flex-shrink-0"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-emerald-800">
                {formSteps[currentFormStep - 1].title}
              </h2>
              <span className="text-sm font-medium text-emerald-600">
                Step {currentFormStep} of {totalSteps}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
              {formSteps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div
                    className={`flex items-center cursor-pointer ${index < currentFormStep ? 'text-emerald-600' : index === currentFormStep - 1 ? 'text-emerald-700' : 'text-gray-400'}`}
                    onClick={() => handleStepClick(step.number)}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      index < currentFormStep - 1
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : index === currentFormStep - 1
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {index < currentFormStep - 1 ? '✓' : step.number}
                    </div>
                    <span className="ml-2 text-xs font-medium hidden md:inline">{step.title}</span>
                  </div>
                  {index < formSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentFormStep - 1 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentFormStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (currentFormStep === totalSteps) {
              handleSubmit(e);
            } else {
              handleNextStep();
            }
          }} className="space-y-6">
            {/* STEP 1: Basic Project Info (6 questions) */}
            {currentFormStep === 1 && (
              <>
            {/* Renovation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of renovation do you need? *
              </label>
              <select
                required
                value={formData.renovationType}
                onChange={(e) => handleInputChange('renovationType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select renovation type...</option>
                {RENOVATION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated budget needed? *
              </label>
              <select
                required
                value={formData.estimatedBudget}
                onChange={(e) => handleInputChange('estimatedBudget', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select budget range...</option>
                {BUDGET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property type? *
              </label>
              <select
                required
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select property type...</option>
                {PROPERTY_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly household income? *
              </label>
              <select
                required
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select income range...</option>
                {INCOME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Ownership */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you own the property? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    required
                    name="ownership"
                    value="yes"
                    checked={formData.ownership === 'yes'}
                    onChange={(e) => handleInputChange('ownership', e.target.value)}
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">Yes, I own it</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    required
                    name="ownership"
                    value="no"
                    checked={formData.ownership === 'no'}
                    onChange={(e) => handleInputChange('ownership', e.target.value)}
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">No, I'm a tenant</span>
                </label>
              </div>
            </div>

            {/* Energy Efficiency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is this renovation focused on energy efficiency? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    required
                    name="energyEfficiency"
                    value="yes"
                    checked={formData.energyEfficiency === 'yes'}
                    onChange={(e) => handleInputChange('energyEfficiency', e.target.value)}
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    required
                    name="energyEfficiency"
                    value="no"
                    checked={formData.energyEfficiency === 'no'}
                    onChange={(e) => handleInputChange('energyEfficiency', e.target.value)}
                    className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>
              </>
            )}

            {/* STEP 2: Property Details (8 questions) */}
            {currentFormStep === 2 && (
              <>
            {/* Property Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property size (square meters)? *
              </label>
              <select
                required
                value={formData.propertySize || ''}
                onChange={(e) => handleInputChange('propertySize', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select property size...</option>
                {PROPERTY_SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Required for KfW funding calculations</p>
            </div>

            {/* Property Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When was the property built? *
              </label>
              <select
                required
                value={formData.propertyAge || ''}
                onChange={(e) => handleInputChange('propertyAge', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select property age...</option>
                {PROPERTY_AGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Pre-1977 buildings require different energy certificates</p>
            </div>

            {/* Property Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current property condition? *
              </label>
              <select
                required
                value={formData.propertyCondition || ''}
                onChange={(e) => handleInputChange('propertyCondition', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select condition...</option>
                {PROPERTY_CONDITION_EXTENDED_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Location (German State) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property location (Bundesland)? *
              </label>
              <select
                required
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select state...</option>
                {GERMAN_STATES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Regional subsidy programs vary by state</p>
            </div>

            {/* Property Use */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How is the property used? *
              </label>
              <select
                required
                value={formData.propertyUse || ''}
                onChange={(e) => handleInputChange('propertyUse', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select use...</option>
                {PROPERTY_USE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Number of Residential Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of residential units?
              </label>
              <select
                value={formData.residentialUnits || ''}
                onChange={(e) => handleInputChange('residentialUnits', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select units...</option>
                {RESIDENTIAL_UNITS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">KfW loans calculated per residential unit</p>
            </div>

            {/* Current Energy Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current energy rating (if known)?
              </label>
              <select
                value={formData.currentEnergyRating || ''}
                onChange={(e) => handleInputChange('currentEnergyRating', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select rating...</option>
                {ENERGY_RATING_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Have Energy Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have an energy certificate (Energieausweis)?
              </label>
              <select
                value={formData.hasEnergyCertificate || ''}
                onChange={(e) => handleInputChange('hasEnergyCertificate', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {YES_NO_UNKNOWN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Required for most KfW/BAFA applications (valid 10 years)</p>
            </div>
              </>
            )}

            {/* STEP 3: Financial Information (7 questions) */}
            {currentFormStep === 3 && (
              <>
            {/* Annual Household Income */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Critical:</strong> Households earning ≤€90,000/year qualify for KfW 358 supplementary loans (€120,000 additional financing)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual household income? *
              </label>
              <select
                required
                value={formData.annualIncome || ''}
                onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select annual income...</option>
                {ANNUAL_INCOME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Available Savings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available savings for down payment? *
              </label>
              <select
                required
                value={formData.availableSavings || ''}
                onChange={(e) => handleInputChange('availableSavings', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select savings...</option>
                {AVAILABLE_SAVINGS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Most programs require 10-30% co-financing</p>
            </div>

            {/* Existing Debts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing debts/mortgage? *
              </label>
              <select
                required
                value={formData.existingDebts || ''}
                onChange={(e) => handleInputChange('existingDebts', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select debt level...</option>
                {EXISTING_DEBTS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Monthly Debt Payments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly debt obligations? *
              </label>
              <select
                required
                value={formData.monthlyDebtPayments || ''}
                onChange={(e) => handleInputChange('monthlyDebtPayments', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select monthly payments...</option>
                {MONTHLY_DEBT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* SCHUFA Credit Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SCHUFA credit score? *
              </label>
              <select
                required
                value={formData.creditScore || ''}
                onChange={(e) => handleInputChange('creditScore', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select credit score...</option>
                {CREDIT_SCORE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Check your score at meineschufa.de</p>
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment status? *
              </label>
              <select
                required
                value={formData.employmentStatus || ''}
                onChange={(e) => handleInputChange('employmentStatus', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select employment status...</option>
                {EMPLOYMENT_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Co-applicant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Co-applicant with additional income?
              </label>
              <select
                value={formData.hasCoApplicant || ''}
                onChange={(e) => handleInputChange('hasCoApplicant', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {CO_APPLICANT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Combined income can increase borrowing capacity</p>
            </div>
              </>
            )}

            {/* STEP 4: Energy & Technical (5 questions) */}
            {currentFormStep === 4 && (
              <>
            {/* Current Heating System */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current heating system? *
              </label>
              <select
                required
                value={formData.currentHeatingSystem || ''}
                onChange={(e) => handleInputChange('currentHeatingSystem', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select heating system...</option>
                {HEATING_SYSTEM_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">BAFA subsidizes renewable heating replacement (up to 70%)</p>
            </div>

            {/* Heating System Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heating system age? *
              </label>
              <select
                required
                value={formData.heatingSystemAge || ''}
                onChange={(e) => handleInputChange('heatingSystemAge', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select age...</option>
                {HEATING_AGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Planned Energy Measures */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned energy improvements? *
              </label>
              <select
                required
                value={formData.plannedEnergyMeasures || ''}
                onChange={(e) => handleInputChange('plannedEnergyMeasures', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select measures...</option>
                {PLANNED_MEASURES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Target Efficiency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target energy efficiency level?
              </label>
              <select
                value={formData.targetEfficiencyLevel || ''}
                onChange={(e) => handleInputChange('targetEfficiencyLevel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select efficiency level...</option>
                {TARGET_EFFICIENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Higher efficiency = higher grants (up to €75,000)</p>
            </div>

            {/* Energy Consultant */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Required:</strong> Energy consultant mandatory for KfW/BAFA applications (50% of consultant costs subsidized up to €5,000)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have energy consultant? *
              </label>
              <select
                required
                value={formData.hasEnergyConsultant || ''}
                onChange={(e) => handleInputChange('hasEnergyConsultant', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {ENERGY_CONSULTANT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
              </>
            )}

            {/* STEP 5: Timeline & Planning (4 questions) */}
            {currentFormStep === 5 && (
              <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> You MUST apply BEFORE starting any work (mandatory since September 2024). Starting early disqualifies ALL funding!
              </p>
            </div>

            {/* Project Start Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project start status? *
              </label>
              <select
                required
                value={formData.projectStartTimeline || ''}
                onChange={(e) => handleInputChange('projectStartTimeline', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select status...</option>
                {PROJECT_START_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Renovation Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected renovation duration? *
              </label>
              <select
                required
                value={formData.renovationDuration || ''}
                onChange={(e) => handleInputChange('renovationDuration', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select duration...</option>
                {RENOVATION_DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Funding must be used within 54 months</p>
            </div>

            {/* Contractor Quotes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have contractor quotes? *
              </label>
              <select
                required
                value={formData.hasContractorQuotes || ''}
                onChange={(e) => handleInputChange('hasContractorQuotes', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {CONTRACTOR_QUOTES_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Required for KfW/BAFA application</p>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency level?
              </label>
              <select
                value={formData.urgencyLevel || ''}
                onChange={(e) => handleInputChange('urgencyLevel', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select urgency...</option>
                {URGENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Some programs have limited budgets (first-come basis)</p>
            </div>
              </>
            )}

            {/* STEP 6: Personal & Documentation (8 questions) */}
            {currentFormStep === 6 && (
              <>
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your age range?
              </label>
              <select
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select age range...</option>
                {AGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">60+ qualifies for accessibility/barrier-free grants (KfW 455-B)</p>
            </div>

            {/* Household Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Household size?
              </label>
              <select
                value={formData.householdSize || ''}
                onChange={(e) => handleInputChange('householdSize', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select household size...</option>
                {HOUSEHOLD_SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Residence Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residence status? *
              </label>
              <select
                required
                value={formData.residenceStatus || ''}
                onChange={(e) => handleInputChange('residenceStatus', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select residence status...</option>
                {RESIDENCE_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Permanent residence required for most loans</p>
            </div>

            {/* German Tax Resident */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                German tax resident with filed returns? *
              </label>
              <select
                required
                value={formData.germanTaxResident || ''}
                onChange={(e) => handleInputChange('germanTaxResident', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {TAX_RESIDENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Need 2022 & 2023 tax returns for 2025 KfW 358/359 applications</p>
            </div>

            {/* SCHUFA Report Available */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have SCHUFA report?
              </label>
              <select
                value={formData.hasSchufaReport || ''}
                onChange={(e) => handleInputChange('hasSchufaReport', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {YES_NO_UNKNOWN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Get free report at meineschufa.de</p>
            </div>

            {/* Property Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have property documents? *
              </label>
              <select
                required
                value={formData.hasPropertyDocuments || ''}
                onChange={(e) => handleInputChange('hasPropertyDocuments', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {PROPERTY_DOCS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Need Grundbuchauszug (land register)</p>
            </div>

            {/* Income Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have income verification documents? *
              </label>
              <select
                required
                value={formData.hasIncomeDocuments || ''}
                onChange={(e) => handleInputChange('hasIncomeDocuments', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {DOCUMENT_READY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Need last 3 salary slips, bank statements</p>
            </div>

            {/* Ready to Apply */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ready to apply for financing? *
              </label>
              <select
                required
                value={formData.readyToApply || ''}
                onChange={(e) => handleInputChange('readyToApply', e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="">Select...</option>
                {READY_TO_APPLY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Application takes 3-4 weeks for approval</p>
            </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="pt-6 flex justify-between items-center gap-4">
              {/* Previous Button */}
              {currentFormStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition duration-200 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}

              {/* Spacer for when there's no Previous button */}
              {currentFormStep === 1 && <div />}

              {/* Next/Submit Button */}
              {currentFormStep < totalSteps ? (
                <button
                  type="submit"
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition duration-200 flex items-center gap-2 shadow-md ml-auto"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md ml-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Get AI-Powered Analysis</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* Results Display */
        <div className="space-y-8">
          {/* AI Analysis Results */}
          {ragAnalysis && !analysisError ? (
            <>
              {/* Cost Calculator Component */}
              <CostCalculator
                totalEstimatedCost={ragAnalysis.costEstimate.totalEstimatedCost}
                breakdown={ragAnalysis.costEstimate.breakdown}
                contingency={ragAnalysis.costEstimate.contingency}
                explanation={ragAnalysis.costEstimate.explanation}
                userBudget={parseBudgetToNumber(formData.estimatedBudget)}
              />

              {/* Financing Recommendations Component */}
              <FinancingRecommendations
                recommendations={ragAnalysis.recommendations}
                summary={ragAnalysis.summary}
                nextSteps={ragAnalysis.nextSteps}
              />

              {/* Document Checklist */}
              <DocumentChecklist
                renovationType={formData.renovationType}
                ownership={formData.ownership}
                energyEfficiency={formData.energyEfficiency}
                estimatedBudget={formData.estimatedBudget}
              />

              {/* Back Button */}
              <div className="flex justify-center">
                <button
                  onClick={resetForm}
                  className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
                >
                  ← Start New Analysis
                </button>
              </div>
            </>
          ) : (
            /* Fallback to Basic Results or Show Error */
            <>
              {/* Show error if AI failed */}
              {analysisError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">AI Analysis Unavailable</h3>
                    <p className="text-sm text-amber-800 mb-2">{analysisError}</p>
                    <p className="text-sm text-amber-700">Showing basic financing options below.</p>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-3">Your Project Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Renovation Type:</span>
                    <p className="font-semibold text-gray-900">
                      {RENOVATION_TYPE_OPTIONS.find(opt => opt.value === formData.renovationType)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <p className="font-semibold text-gray-900">
                      {BUDGET_OPTIONS.find(opt => opt.value === formData.estimatedBudget)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Property:</span>
                    <p className="font-semibold text-gray-900 capitalize">{formData.propertyType}</p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-4 text-emerald-700 hover:text-emerald-800 font-medium text-sm underline"
                >
                  Modify search criteria
                </button>
              </div>

          {/* Results Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {matchedOptions.length > 0
                ? `We found ${matchedOptions.length} financing option${matchedOptions.length > 1 ? 's' : ''} for you`
                : 'No exact matches found'}
            </h2>
            <p className="text-gray-600">
              {matchedOptions.length > 0
                ? 'Here are the best financing options based on your requirements:'
                : 'Try adjusting your criteria or contact us for personalized assistance.'}
            </p>
          </div>

          {/* No Results Message */}
          {matchedOptions.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">No Perfect Match Found</h3>
                <p className="text-amber-800 mb-4">
                  We couldn't find financing options that exactly match all your criteria. However, you may still be eligible for general renovation loans or subsidies.
                </p>
                <button
                  onClick={resetForm}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Try Different Criteria
                </button>
              </div>
            </div>
          )}

          {/* Financing Options Cards */}
          <div className="space-y-6">
            {matchedOptions.map((option) => (
              <div key={option.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{option.name}</h3>
                      <p className="text-emerald-100">{option.provider}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getFinancingTypeColor(option.type)}`}>
                      {getFinancingTypeLabel(option.type)}
                    </div>
                  </div>
                  <p className="text-emerald-50">{option.description}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {option.interestRate && (
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Interest Rate</p>
                            <p className="font-semibold text-gray-900">{option.interestRate}</p>
                          </div>
                        </div>
                      )}
                      {option.maxAmount && (
                        <div className="flex items-start gap-3">
                          <Euro className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">Maximum Amount</p>
                            <p className="font-semibold text-gray-900">{option.maxAmount}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div>
                      <div className="flex items-start gap-3">
                        <Home className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Eligibility</p>
                          <ul className="space-y-1">
                            {option.eligibility.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advantages */}
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-900 mb-2">Key Advantages</h4>
                    <ul className="space-y-1">
                      {option.advantages.map((advantage, idx) => (
                        <li key={idx} className="text-sm text-green-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <a
                    href={option.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 text-center"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Learn More & Apply
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          {matchedOptions.length > 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Compare the options above and select those that best fit your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Visit the official websites to check current rates and requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Consult with a financial advisor to discuss combining multiple funding sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Many grants and subsidies can be combined with loans for better coverage</span>
                </li>
              </ul>
            </div>
          )}

              {/* Document Checklist for Fallback */}
              {matchedOptions.length > 0 && (
                <DocumentChecklist
                  renovationType={formData.renovationType}
                  ownership={formData.ownership}
                  energyEfficiency={formData.energyEfficiency}
                  estimatedBudget={formData.estimatedBudget}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* AI Financing Assistant - Available on all pages */}
      <FinancingAssistant />
    </div>
  );
};

export default Financing;