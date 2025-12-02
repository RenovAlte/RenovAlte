import React from "react";
import Text from "../../components/Text/Text";

interface CompareStepProps {
	onStepChange?: (step: number) => void;
}

const CompareStep: React.FC<CompareStepProps> = () => {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 text-center">
			<Text className="text-gray-500 text-sm sm:text-base">Compare step - Coming soon</Text>
		</div>
	);
};

export default CompareStep;

