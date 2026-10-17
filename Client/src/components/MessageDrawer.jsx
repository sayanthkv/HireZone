import React, { useEffect, useState } from "react";
import api from "../services/api";
import ChatModal from "./ChatModal";

export default function MessageDrawer({ isOpen, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser._id || currentUser.id;

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError("");

      if (currentUser.role === "student") {
        // Fetch student's applications eligible for chat
        const response = await api.get("/applications/me");
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.applications || [];

        const eligible = list.filter((app) =>
          ["Shortlisted", "Hired"].includes(app.status)
        );
        setConversations(eligible);
      } else if (currentUser.role === "recruiter") {
        // 1. Fetch recruiter's posted jobs
        const jobsRes = await api.get("/jobs?limit=100");
        const allJobs = Array.isArray(jobsRes.data.jobs) ? jobsRes.data.jobs : [];

        const ownJobs = allJobs.filter((job) => {
          const ownerId = typeof job.postedBy === "object" ? job.postedBy?._id : job.postedBy;
          return ownerId && String(ownerId) === String(currentUserId);
        });

        // 2. Fetch applicants across own jobs
        const applicantPromises = ownJobs.map((job) =>
          api.get(`/applications/job/${job._id}/applicants`).catch(() => null)
        );

        const results = await Promise.all(applicantPromises);
        let eligibleApps = [];

        results.forEach((res) => {
          if (res?.data) {
            const list = Array.isArray(res.data)
              ? res.data
              : res.data.applications || res.data.applicants || [];

            const eligible = list.filter((app) =>
              ["Shortlisted", "Hired"].includes(app.status)
            );
            eligibleApps = [...eligibleApps, ...eligible];
          }
        });

        // 3. Filter ONLY applications that already have active message history
        const activeConversationPromises = eligibleApps.map(async (app) => {
          try {
            const msgRes = await api.get(`/chat/${app._id}`);
            const messages = Array.isArray(msgRes.data) ? msgRes.data : [];
            return messages.length > 0 ? app : null;
          } catch {
            return null;
          }
        });

        const activeApps = (await Promise.all(activeConversationPromises)).filter(Boolean);
        setConversations(activeApps);
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setError("Unable to load active conversations.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#111827" }}>
            💬 Messages
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {loading && (
            <p style={{ color: "#6b7280", textAlign: "center" }}>Loading conversations...</p>
          )}

          {error && (
            <div
              style={{
                color: "#991b1b",
                backgroundColor: "#fee2e2",
                padding: "10px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && conversations.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#6b7280" }}>
              <p style={{ fontWeight: "600", fontSize: "15px" }}>No active chats</p>
              <p style={{ fontSize: "13px", marginTop: "6px" }}>
                {currentUser.role === "recruiter"
                  ? "Initiate a chat directly from your applicant list on the dashboard to start a conversation."
                  : "Conversations will appear here once a recruiter shortlists your application."}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {conversations.map((app) => {
              const isStudent = currentUser.role === "student";
              const partner = isStudent ? app.job?.postedBy : app.student;
              const partnerName = partner?.name || (isStudent ? "Recruiter" : "Student");
              const jobTitle = app.job?.title || "Job Application";
              const partnerId =
                typeof partner === "object" ? partner?._id || partner?.id : partner;

              return (
                <div
                  key={app._id}
                  style={{
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() =>
                    setActiveChat({
                      applicationId: app._id,
                      receiverId: partnerId,
                      name: partnerName,
                    })
                  }
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "15px", color: "#1f2937" }}>{partnerName}</strong>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                    Role: {jobTitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeChat && (
        <ChatModal
          applicationId={activeChat.applicationId}
          currentUserId={currentUserId}
          receiverId={activeChat.receiverId}
          applicantName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}