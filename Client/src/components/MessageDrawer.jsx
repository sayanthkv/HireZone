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
        const response = await api.get("/applications/me");
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.applications || [];

        const eligible = list.filter((app) =>
          ["Shortlisted", "Hired"].includes(app.status)
        );
        setConversations(eligible);
      } else if (currentUser.role === "recruiter") {
        const jobsRes = await api.get("/jobs?limit=100");
        const allJobs = Array.isArray(jobsRes.data.jobs) ? jobsRes.data.jobs : [];

        const ownJobs = allJobs.filter((job) => {
          const ownerId =
            typeof job.postedBy === "object" ? job.postedBy?._id : job.postedBy;
          return ownerId && String(ownerId) === String(currentUserId);
        });

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

        const activeConversationPromises = eligibleApps.map(async (app) => {
          try {
            const msgRes = await api.get(`/chat/${app._id}`);
            const messages = Array.isArray(msgRes.data) ? msgRes.data : [];
            return messages.length > 0 ? app : null;
          } catch {
            return null;
          }
        });

        const activeApps = (await Promise.all(activeConversationPromises)).filter(
          Boolean
        );
        setConversations(activeApps);
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setError("Unable to load active conversations.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(3px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        transition: "opacity 0.2s ease-in-out",
      }}
      onClick={onClose}
    >
      {/* Dynamic CSS Keyframes for Drawer Animation */}
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .drawer-card:hover {
            border-color: #2563eb !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
          }
        `}
      </style>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              Messages
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Direct Candidate & Recruiter Chat
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "#f8fafc",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Section */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
                Loading conversations...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#991b1b",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && conversations.length === 0 && !error && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "#f8fafc",
                borderRadius: "12px",
                border: "1px dashed #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                  fontSize: "20px",
                }}
              >
                💬
              </div>
              <p
                style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: "#0f172a",
                  margin: "0 0 6px 0",
                }}
              >
                No Active Messages
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
                {currentUser.role === "recruiter"
                  ? "Message candidates directly from your applicant list to start a chat."
                  : "Conversations will appear here once a recruiter shortlists your application."}
              </p>
            </div>
          )}

          {/* Conversation Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {conversations.map((app) => {
              const isStudent = currentUser.role === "student";
              const partner = isStudent ? app.job?.postedBy : app.student;
              const partnerName = partner?.name || (isStudent ? "Recruiter" : "Student");
              const jobTitle = app.job?.title || "Job Application";
              const companyName = app.job?.company || "";
              const partnerId =
                typeof partner === "object" ? partner?._id || partner?.id : partner;

              const isHired = app.status === "Hired";

              return (
                <div
                  key={app._id}
                  className="drawer-card"
                  style={{
                    padding: "14px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                  onClick={() =>
                    setActiveChat({
                      applicationId: app._id,
                      receiverId: partnerId,
                      name: partnerName,
                    })
                  }
                >
                  {/* User Initial Avatar Badge */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: isStudent ? "#eff6ff" : "#f0fdf4",
                      color: isStudent ? "#2563eb" : "#16a34a",
                      fontWeight: "700",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(partnerName)}
                  </div>

                  {/* Details Container */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "2px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "14px",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {partnerName}
                      </strong>

                      <span
                        style={{
                          fontSize: "10px",
                          backgroundColor: isHired ? "#dcfce7" : "#e0f2fe",
                          color: isHired ? "#15803d" : "#0369a1",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {jobTitle} {companyName ? `• ${companyName}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render Chat Modal Overlay */}
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