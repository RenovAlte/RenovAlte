import React from "react";
import Text from "../../components/Text/Text";

interface DraftStepProps {
	onStepChange?: (step: number) => void;
}

const DraftStep: React.FC<DraftStepProps> = () => {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
			<Text className="text-gray-500 text-sm sm:text-base">Draft step - Coming soon</Text>
		</div>
	);
};

export default DraftStep;

