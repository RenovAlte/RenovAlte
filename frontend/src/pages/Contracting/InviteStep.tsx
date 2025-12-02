import React, { useState, useEffect, useCallback } from "react";
import Heading from "../../components/Heading/Heading";
import Text from "../../components/Text/Text";
import { Contractor } from "../../services/contractors";
import { PROJECT_TYPES, Project } from "../../services/projects";
import { ArrowLeft, MapPin, CheckCircle2, Loader2, Mail, Send, User, Users } from "lucide-react";

interface InviteStepProps {
	selectedProject: Project;
	contractors: Contractor[];
	selectedContractors: Set<number>;
	onStepChange: (step: number) => void;
}

const InviteStep: React.FC<InviteStepProps> = ({
	selectedProject,
	contractors,
	selectedContractors,
	onStepChange,
}) => {
	const [emailSubject, setEmailSubject] = useState("");
	const [emailBody, setEmailBody] = useState("");
	const [sendingEmail, setSendingEmail] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generateDefaultEmailBody = useCallback((): string => {
		const projectTypeLabel = PROJECT_TYPES.find((pt) => pt.value === selectedProject.project_type)?.label || selectedProject.project_type;
		const address = [selectedProject.city, selectedProject.state].filter(Boolean).join(", ") || selectedProject.address;
		const budget = selectedProject.budget ? `€${selectedProject.budget.toLocaleString()}` : "To be discussed";

		return `Dear Contractor,

I hope this email finds you well. I am reaching out to invite you to submit a proposal for my renovation project.

Project Details:
- Project Type: ${projectTypeLabel}
- Address: ${address}
- Budget: ${budget}
${selectedProject.additional_information ? `- Additional Information: ${selectedProject.additional_information}` : ""}

I would appreciate it if you could review the project details and provide a quote at your earliest convenience. Please let me know if you need any additional information or would like to schedule a site visit.

Thank you for your time and consideration.

Best regards`;
	}, [selectedProject]);

	// Generate default email template when component mounts or selected contractors change
	useEffect(() => {
		if (selectedProject && selectedContractors.size > 0) {
			const defaultSubject = `Project Invitation: ${selectedProject.name}`;
			const defaultBody = generateDefaultEmailBody();
			setEmailSubject(defaultSubject);
			setEmailBody(defaultBody);
			setEmailSent(false);
		}
	}, [selectedProject, selectedContractors, generateDefaultEmailBody]);

	const handleSendEmail = async () => {
		if (!selectedProject || selectedContractors.size === 0) return;

		const selectedContractorsList = contractors.filter(
			(c) => c.id !== undefined && selectedContractors.has(c.id)
		);

		// Validate that all contractors have email addresses
		const contractorsWithoutEmail = selectedContractorsList.filter((c) => !c.email);
		if (contractorsWithoutEmail.length > 0) {
			setError(`Some contractors don't have email addresses: ${contractorsWithoutEmail.map((c) => c.name).join(", ")}`);
			return;
		}

		setSendingEmail(true);
		setError(null);

		try {
			// TODO: Implement actual email sending API call
			// For now, simulate sending
			await new Promise((resolve) => setTimeout(resolve, 1500));
			
			// In a real implementation, you would call an API like:
			// await contractorApi.sendInvitations({
			//   projectId: selectedProject.id,
			//   contractorIds: Array.from(selectedContractors),
			//   subject: emailSubject,
			//   body: emailBody
			// });

			setEmailSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send email");
		} finally {
			setSendingEmail(false);
		}
	};

	const selectedContractorsList = contractors.filter(
		(c) => c.id !== undefined && selectedContractors.has(c.id)
	);

	if (selectedContractorsList.length === 0) {
		return (
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 text-center">
				<Users className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 mx-auto mb-3" />
				<Heading level={3} className="text-lg sm:text-xl text-gray-900 mb-2">
					No Contractors Selected
				</Heading>
				<Text className="text-gray-600 text-sm sm:text-base mb-4">
					Please go back to the Matching step and select contractors to invite.
				</Text>
				<button
					onClick={() => onStepChange(1)}
					className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Matching
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Recipients Section */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4 sm:p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="bg-blue-600 p-2 rounded-lg">
						<Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
					</div>
					<div className="flex-1">
						<Heading level={3} className="text-lg sm:text-xl text-gray-900 mb-1">
							Recipients
						</Heading>
						<Text className="text-sm sm:text-base text-gray-700">
							{selectedContractorsList.length} contractor{selectedContractorsList.length !== 1 ? "s" : ""} will receive this invitation
						</Text>
					</div>
				</div>

				{/* Recipients List */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
					{selectedContractorsList.map((contractor) => (
						<div
							key={contractor.id}
							className="bg-white rounded-lg border border-blue-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start gap-2 mb-2">
								<User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
								<div className="flex-1 min-w-0">
									<h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
										{contractor.name}
									</h4>
									{contractor.email && (
										<Text className="text-xs sm:text-sm text-gray-600 truncate mt-1">
											{contractor.email}
										</Text>
									)}
									{!contractor.email && (
										<Text className="text-xs text-red-600 mt-1">No email address</Text>
									)}
								</div>
							</div>
							{contractor.city && contractor.state && (
								<div className="flex items-center gap-1 text-xs text-gray-500">
									<MapPin className="w-3 h-3" />
									<span className="truncate">
										{contractor.city}, {contractor.state}
									</span>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Email Draft Section */}
			{emailSent ? (
				<div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 sm:p-6 text-center">
					<CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-4" />
					<Heading level={3} className="text-lg sm:text-xl text-gray-900 mb-2">
						Invitations Sent Successfully!
					</Heading>
					<Text className="text-gray-600 text-sm sm:text-base mb-4">
						Your invitations have been sent to {selectedContractorsList.length} contractor{selectedContractorsList.length !== 1 ? "s" : ""}.
					</Text>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={() => onStepChange(3)}
							className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
						>
							Proceed to Offers
						</button>
						<button
							onClick={() => {
								setEmailSent(false);
								setEmailSubject(`Project Invitation: ${selectedProject?.name}`);
								setEmailBody(generateDefaultEmailBody());
							}}
							className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
						>
							Send Another
						</button>
					</div>
				</div>
			) : (
				<div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
					<div className="flex items-center gap-3 mb-4 sm:mb-6">
						<div className="bg-emerald-600 p-2 rounded-lg">
							<Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
						</div>
						<div>
							<Heading level={3} className="text-lg sm:text-xl text-gray-900 mb-1">
								Email Draft
							</Heading>
							<Text className="text-sm text-gray-600">
								Review and customize your invitation email
							</Text>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
							<Text className="text-red-800 text-sm sm:text-base">{error}</Text>
						</div>
					)}

					{/* Email Form */}
					<div className="space-y-4 sm:space-y-6">
						{/* Subject Field */}
						<div>
							<label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-2">
								Subject
							</label>
							<input
								id="email-subject"
								type="text"
								value={emailSubject}
								onChange={(e) => setEmailSubject(e.target.value)}
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
								placeholder="Enter email subject"
							/>
						</div>

						{/* Body Field */}
						<div>
							<label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-2">
								Message
							</label>
							<textarea
								id="email-body"
								value={emailBody}
								onChange={(e) => setEmailBody(e.target.value)}
								rows={12}
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base resize-y font-mono"
								placeholder="Enter email message"
							/>
							<Text className="text-xs text-gray-500 mt-1">
								You can customize this message before sending
							</Text>
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
							<button
								onClick={handleSendEmail}
								disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
								className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{sendingEmail ? (
									<>
										<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
										<span>Sending...</span>
									</>
								) : (
									<>
										<Send className="w-4 h-4 sm:w-5 sm:h-5" />
										<span>Send Invitations</span>
									</>
								)}
							</button>
							<button
								onClick={() => {
									setEmailSubject(`Project Invitation: ${selectedProject?.name}`);
									setEmailBody(generateDefaultEmailBody());
								}}
								className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
							>
								Reset to Default
							</button>
							<button
								onClick={() => onStepChange(1)}
								className="bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
							>
								Back
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default InviteStep;

