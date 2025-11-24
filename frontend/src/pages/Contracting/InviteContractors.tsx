import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";

const InviteContractors = () => {
  const { user } = useAuth();
  const { selectedProject } = useProject();

  const [selectedContractorIds, setSelectedContractorIds] = useState<number[]>([]);

  const sendInvites = async () => {
    console.log("=== SEND INVITES CLICKED ===");
    console.log("User:", user);
    console.log("User ID:", user?.id);
    console.log("Selected Project:", selectedProject);
    console.log("Project ID:", selectedProject?.id);
    console.log("Selected Contractor IDs:", selectedContractorIds);
    console.log("Contractor IDs length:", selectedContractorIds.length);

    if (!user) {
      console.error("❌ VALIDATION FAILED: No user");
      alert("You must be logged in to send invites.");
      return;
    }
    console.log("✅ User validation passed");

    if (!selectedProject) {
      console.error("❌ VALIDATION FAILED: No project selected");
      alert("Please select a project before inviting contractors.");
      return;
    }
    console.log("✅ Project validation passed");

    if (selectedContractorIds.length === 0) {
      console.error("❌ VALIDATION FAILED: No contractors selected");
      alert("Please select at least one contractor.");
      return;
    }
    console.log("✅ Contractors validation passed");

    try {
      console.log("🚀 Sending POST request to /api/contractors/invitations/");
      console.log("Payload:", {
        user: user.id,
        project: selectedProject.id,
        contractor_ids: selectedContractorIds,
      });

      const response = await axios.post("/api/contractors/invitations/", {
        user: user.id,
        project: selectedProject.id,
        contractor_ids: selectedContractorIds,
      });

      console.log("✅ Response received:", response.data);
      alert("Invitations sent successfully!");

    } catch (error) {
      const axiosError = error as any;
      console.error("❌ ERROR:", error);
      console.error("Error message:", axiosError.message);
      if (axiosError.response) {
        console.error("Response status:", axiosError.response.status);
        console.error("Response data:", axiosError.response.data);
      }
      alert("Failed to send invitations.");
    }
  };

  return (
    <div>
      <h2>Invite Contractors</h2>

      {/* Example button to simulate selecting contractors */}
      <button onClick={() => {
        setSelectedContractorIds([1, 2]);
        console.log("✅ Selected contractors: [1, 2]");
      }}>
        (Example) Select Contractors
      </button>

      <br /><br />

      <button onClick={sendInvites} className="invite-btn">
        Send Invitations
      </button>
    </div>
  );
};

export default InviteContractors;