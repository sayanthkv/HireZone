import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import ChatModal from "../components/ChatModal";
import "./RecruiterApplicants.css";

const PIPELINE_STAGES = [
  { key: "Pending", label: "Pending", accent: "#64748b", badgeBg: "#f1f5f9" },
  { key: "Reviewed", label: "Reviewed", accent: "#2563eb", badgeBg: "#dbeafe" },
  { key: "Shortlisted", label: "Shortlisted", accent: "#7c3aed", badgeBg: "#ede9fe" },
  { key: "Hired", label: "Hired", accent: "#16a34a", badgeBg: "#dcfce7" },
  { key: "Rejected", label: "Rejected", accent: "#dc2626", badgeBg: "#fee2e2" },
];

export default function RecruiterApplicants() {
  const { jobId } = useParams();

  const [selectedChat, setSelectedChat] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI & Drag-and-Drop states
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"
  const [sortByScore, setSortByScore] = useState(true);
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [expandedAiAppId, setExpandedAiAppId] = useState(null);

  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser) : {};
  const currentUserId = currentUser._id || currentUser.id || "";

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/applications/job/${jobId}/applicants`);
      const data = response.data;

      if (data.job) setJobTitle(data.job);

      const list = Array.isArray(data)
        ? data
        : data.applications || data.applicants || [];

      setApplicants(list);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  // Optimistic status update with automatic rollback on API failure
  const handleStatusChange = async (applicationId, newStatus) => {
    const previousApplicants = [...applicants];
    const targetApp = applicants.find((a) => a._id === applicationId);

    if (!targetApp || targetApp.status === newStatus) return;

    // 1. Optimistic UI update (instant visual move)
    setApplicants((prev) =>
      prev.map((app) =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      )
    );

    try {
      setError("");
      await api.patch(`/applications/${applicationId}/status`, {
        status: newStatus,
      });
    } catch (err) {
      // 2. Rollback UI if server rejects update
      setApplicants(previousApplicants);
      setError(
        err.response?.data?.message ||
          "Failed to move candidate. Reverted changes."
      );
    }
  };

  // Native HTML5 Drag Handlers
  const onDragStart = (e, applicationId) => {
    setDraggedAppId(applicationId);
    e.dataTransfer.setData("applicationId", applicationId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const onDragLeave = () => {
    setDragOverStage(null);
  };

  const onDrop = (e, targetStage) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("applicationId") || draggedAppId;
    setDraggedAppId(null);
    setDragOverStage(null);

    if (appId) {
      handleStatusChange(appId, targetStage);
    }
  };

  const sortedApplicants = [...applicants].sort((a, b) => {
    if (!sortByScore) return 0;
    const scoreA = a.aiEvaluation?.matchScore ?? -1;
    const scoreB = b.aiEvaluation?.matchScore ?? -1;
    return scoreB - scoreA;
  });

  const getScoreBadgeStyle = (score) => {
    if (score >= 80) return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
    if (score >= 60) return { bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
    return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
  };

  if (loading) {
    return (
      <main style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ color: "#475569", fontWeight: "500" }}>Loading ATS pipeline...</p>
      </main>
    );
  }

  return (
    <main className="kanban-container">
      <Link
        to="/recruiter-dashboard"
        style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}
      >
        ← Back to dashboard
      </Link>

      <header
        style={{
          margin: "18px 0 24px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              color: "#2563eb",
              fontWeight: "700",
              letterSpacing: "1.2px",
              margin: 0,
            }}
          >
            ATS HIRING PIPELINE
          </p>
          <h1 style={{ fontSize: "26px", margin: "4px 0", color: "#0f172a" }}>
            {jobTitle ? `${jobTitle} — Applicants` : "Job Applicants"}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            Drag candidates across stages to update status and notify them in real time.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* AI Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortByScore((prev) => !prev)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: sortByScore ? "#0f172a" : "#ffffff",
              color: sortByScore ? "#ffffff" : "#334155",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {sortByScore ? "⚡ Ranked by AI Score" : "Sort by AI Score"}
          </button>

          {/* Board / List View Switcher */}
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              Kanban Board
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
          </div>

          <div
            style={{
              background: "#f1f5f9",
              padding: "6px 14px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <strong style={{ fontSize: "18px", color: "#0f172a" }}>{applicants.length}</strong>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Total</span>
          </div>
        </div>
      </header>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {applicants.length === 0 && !error ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>No applicants yet</h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            Candidates who apply for this position will appear in your pipeline automatically.
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ==================== KANBAN BOARD VIEW ==================== */
        <section className="kanban-board">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = sortedApplicants.filter(
              (app) => (app.status || "Pending") === stage.key
            );
            const isOver = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className={`kanban-column ${isOver ? "drag-over" : ""}`}
                onDragOver={(e) => onDragOver(e, stage.key)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, stage.key)}
              >
                <div
                  className="kanban-column-header"
                  style={{ borderBottomColor: stage.accent }}
                >
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#0f172a",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span
                    style={{
                      backgroundColor: stage.badgeBg,
                      color: stage.accent,
                      fontWeight: "700",
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {stageApps.length}
                  </span>
                </div>

                {stageApps.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "12px",
                      marginTop: "32px",
                    }}
                  >
                    Drop candidate here
                  </p>
                ) : (
                  stageApps.map((application) => {
                    const student = application.student || {};
                    const studentId = student._id || student.id || student;
                    const receiverId =
                      typeof studentId === "object" ? studentId._id : studentId;

                    const aiData = application.aiEvaluation;
                    const scoreStyle = aiData
                      ? getScoreBadgeStyle(aiData.matchScore)
                      : null;
                    const isChatEligible =
                      stage.key === "Shortlisted" || stage.key === "Hired";
                    const isExpanded = expandedAiAppId === application._id;

                    return (
                      <article
                        key={application._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, application._id)}
                        onDragEnd={() => {
                          setDraggedAppId(null);
                          setDragOverStage(null);
                        }}
                        className={`kanban-card ${
                          draggedAppId === application._id ? "dragging" : ""
                        }`}
                      >
                        {/* Top row: Avatar + Name + AI Score */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "13px",
                                flexShrink: 0,
                              }}
                            >
                              {(student.name || "S").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: "hidden" }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#0f172a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {student.name || "Student"}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "11px",
                                  color: "#64748b",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {student.email}
                              </p>
                            </div>
                          </div>

                          {aiData && (
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                backgroundColor: scoreStyle.bg,
                                color: scoreStyle.color,
                                border: `1px solid ${scoreStyle.border}`,
                                flexShrink: 0,
                              }}
                            >
                              {aiData.matchScore}%
                            </span>
                          )}
                        </div>

                        {/* AI Summary Preview */}
                        {aiData?.aiSummary && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "8px",
                              backgroundColor: "#f8fafc",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              color: "#475569",
                              lineHeight: "1.4",
                            }}
                          >
                            {aiData.aiSummary}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAiAppId(isExpanded ? null : application._id)
                              }
                              style={{
                                display: "block",
                                marginTop: "4px",
                                background: "none",
                                border: "none",
                                color: "#2563eb",
                                fontSize: "11px",
                                fontWeight: "600",
                                padding: 0,
                                cursor: "pointer",
                              }}
                            >
                              {isExpanded ? "Hide skills ▲" : "Inspect skills ▼"}
                            </button>

                            {isExpanded && (
                              <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
                                {aiData.keyStrengths?.length > 0 && (
                                  <p style={{ margin: "0 0 4px 0", color: "#166534" }}>
                                    <strong>Matched:</strong> {aiData.keyStrengths.join(", ")}
                                  </p>
                                )}
                                {aiData.missingSkills?.length > 0 && (
                                  <p style={{ margin: 0, color: "#b45309" }}>
                                    <strong>Missing:</strong> {aiData.missingSkills.join(", ")}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Footer Actions */}
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "8px",
                            borderTop: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {application.resumeLink ? (
                            <a
                              href={application.resumeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "12px",
                                color: "#2563eb",
                                fontWeight: "600",
                                textDecoration: "none",
                              }}
                            >
                              Resume ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>No link</span>
                          )}

                          {isChatEligible && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedChat({
                                  applicationId: application._id,
                                  receiverId,
                                  applicantName: student.name || "Student",
                                })
                              }
                              style={{
                                backgroundColor: "#16a34a",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "5px",
                                padding: "4px 8px",
                                fontSize: "11.5px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              💬 Chat
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            );
          })}
        </section>
      ) : (
        /* ==================== FALLBACK LIST VIEW ==================== */
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {sortedApplicants.map((application) => {
            const student = application.student || {};
            const studentId = student._id || student.id || student;
            const receiverId = typeof studentId === "object" ? studentId._id : studentId;
            const currentStatus = String(application.status || "Pending").trim();
            const isChatEligible =
              currentStatus.toLowerCase() === "shortlisted" ||
              currentStatus.toLowerCase() === "hired";
            const aiData = application.aiEvaluation;

            return (
              <article
                key={application._id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "18px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>
                    {student.name || "Student"}{" "}
                    {aiData && (
                      <span style={{ fontSize: "12px", color: "#2563eb", marginLeft: "8px" }}>
                        (⚡ {aiData.matchScore}% Match)
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    {student.email}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {isChatEligible && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChat({
                          applicationId: application._id,
                          receiverId,
                          applicantName: student.name || "Student",
                        })
                      }
                      style={{
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      💬 Chat
                    </button>
                  )}

                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(application._id, e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                    }}
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedChat && (
        <ChatModal
          applicationId={selectedChat.applicationId}
          currentUserId={currentUserId}
          receiverId={selectedChat.receiverId}
          applicantName={selectedChat.applicantName}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </main>
  );
}