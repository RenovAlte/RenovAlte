import Heading from "../../components/Heading/Heading";
import React, { useState } from "react";
import Text from "../../components/Text/Text";
import { useProject } from "../../contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { Contractor } from "../../services/contractors";
import { ArrowLeft } from "lucide-react";
import Stepper, { StepperStep } from "../../components/Stepper/Stepper";
import AIAssistant from "../../components/AIAssistant/AIAssistant";
import MatchingStep from "./MatchingStep";
import InviteStep from "./InviteStep";
import OffersStep from "./OffersStep";
import CompareStep from "./CompareStep";
import DraftStep from "./DraftStep";
import SignStep from "./SignStep";

const STEPS: StepperStep[] = [
	{ id: 1, label: "Matching" },
	{ id: 2, label: "Invite" },
	{ id: 3, label: "Offers" },
	{ id: 4, label: "Compare" },
	{ id: 5, label: "Draft" },
	{ id: 6, label: "Sign" },
];

const Contracting: React.FC = () => {
	const { selectedProject } = useProject();
	const navigate = useNavigate();
	const [activeStep, setActiveStep] = useState(1);
	const [contractors, setContractors] = useState<Contractor[]>([]);
	const [selectedContractors, setSelectedContractors] = useState<Set<number>>(new Set());

	const toggleContractorSelection = (contractorId: number) => {
		setSelectedContractors((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(contractorId)) {
				newSet.delete(contractorId);
			} else {
				newSet.add(contractorId);
			}
			return newSet;
		});
	};

	const handleContractorsLoaded = (loadedContractors: Contractor[]) => {
		setContractors(loadedContractors);
	};

	const renderStepContent = () => {
		if (!selectedProject) return null;

		switch (activeStep) {
			case 1:
				return (
					<MatchingStep
						selectedProject={selectedProject}
						selectedContractors={selectedContractors}
						onContractorToggle={toggleContractorSelection}
						onStepChange={setActiveStep}
						onContractorsLoaded={handleContractorsLoaded}
					/>
				);
			case 2:
				return (
					<InviteStep
						selectedProject={selectedProject}
						contractors={contractors}
						selectedContractors={selectedContractors}
						onStepChange={setActiveStep}
					/>
				);
			case 3:
				return <OffersStep onStepChange={setActiveStep} />;
			case 4:
				return <CompareStep onStepChange={setActiveStep} />;
			case 5:
				return <DraftStep onStepChange={setActiveStep} />;
			case 6:
				return <SignStep onStepChange={setActiveStep} />;
			default:
				return null;
		}
	};

	if (!selectedProject) {
		return (
			<div className="text-center py-8 sm:py-12 px-4">
				<Heading level={1} className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl">No Project Selected</Heading>
				<Text className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
					Please select a project from the Home page to access Contracting options.
				</Text>
				<button
					onClick={() => navigate("/")}
					className="flex items-center gap-2 mx-auto bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm sm:text-base"
				>
					<ArrowLeft className="w-4 h-4" />
					Go to Home
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<Heading level={1} className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3">Contracting</Heading>
				<Text className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
					Manage contractors and contracting details for{" "}
					<span className="font-medium">{selectedProject.name}</span>.
				</Text>
			</div>

			{/* Stepper */}
			<div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 overflow-x-auto">
				<Stepper steps={STEPS} activeStep={activeStep} onStepClick={setActiveStep} />
			</div>

			{/* Step Content */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6">{renderStepContent()}</div>

			{/* AI Assistant - Only show in Matching step */}
			{activeStep === 1 && <AIAssistant />}
		</div>
	);
};

export default Contracting;
