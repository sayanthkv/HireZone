import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import ChatModal from "../components/ChatModal";
import "./RecruiterApplicants.css";

const statuses = [
  "Pending",
  "Reviewed",
  "Shortlisted",
  "Rejected",
  "Hired",
];

export default function RecruiterApplicants() {
  const { jobId } = useParams();

  const [selectedChat, setSelectedChat] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  // Retrieve logged-in user safely from localStorage
  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser) : {};
  const currentUserId = currentUser._id || currentUser.id || "";

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/applications/job/${jobId}/applicants`);
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data.applications || data.applicants || [];

      setApplicants(list);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load applicants."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      const res = await api.patch(`/applications/${applicationId}/status`, {
        status: newStatus,
      });

      console.log("Status Update API Response:", res.data);

      const updatedStatus =
        res.data?.application?.status ||
        res.data?.status ||
        res.data?.updatedApplication?.status ||
        newStatus;

      // Update state directly to re-render the card with the new status
      setApplicants((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: updatedStatus } : app
        )
      );
    } catch (err) {
      console.error("Status update error:", err);
      setError(
        err.response?.data?.message || "Unable to update application status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading applicants...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <Link
        to="/recruiter-dashboard"
        style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}
      >
        ← Back to dashboard
      </Link>

      <header
        style={{
          margin: "20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            RECRUITER WORKSPACE
          </p>
          <h1 style={{ fontSize: "28px", margin: "4px 0" }}>Job Applicants</h1>
          <p style={{ color: "#4b5563" }}>
            Review candidates and manage their applications.
          </p>
        </div>

        <div
          style={{
            textAlign: "right",
            background: "#f3f4f6",
            padding: "10px 20px",
            borderRadius: "8px",
          }}
        >
          <strong style={{ fontSize: "24px", display: "block" }}>
            {applicants.length}
          </strong>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            Applicants
          </span>
        </div>
      </header>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {applicants.length === 0 && !error ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <h2>No applicants yet</h2>
          <p style={{ color: "#6b7280" }}>
            When students apply for this job, their applications will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {applicants.map((application) => {
            const student = application.student || {};
            const studentId = student._id || student.id || student;
            const receiverId =
              typeof studentId === "object" ? studentId._id : studentId;

            const currentStatus = String(application.status || "Pending").trim();
            const isChatEligible =
              currentStatus.toLowerCase() === "shortlisted" ||
              currentStatus.toLowerCase() === "hired";

            return (
              <article
                key={application._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {(student.name || "S").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2
                        style={{
                          fontSize: "18px",
                          margin: 0,
                          fontWeight: "600",
                        }}
                      >
                        {student.name || "Student"}
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#6b7280",
                        }}
                      >
                        {student.email || "No email available"}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor: isChatEligible ? "#dcfce7" : "#f3f4f6",
                      color: isChatEligible ? "#166534" : "#374151",
                    }}
                  >
                    {currentStatus}
                  </span>
                </div>

                {application.coverLetter && (
                  <div
                    style={{
                      marginTop: "12px",
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Cover Letter
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px" }}>
                      {application.coverLetter}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #f3f4f6",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    {application.resumeLink ? (
                      <a
                        href={application.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2563eb",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        View Resume ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                        No resume provided
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Message Button rendered when Shortlisted or Hired */}
                    {isChatEligible && (
                      <button
                        type="button"
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontWeight: "600",
                          fontSize: "14px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedChat({
                            applicationId: application._id,
                            receiverId,
                            applicantName: student.name || "Student",
                          })
                        }
                      >
                        💬 Message Candidate
                      </button>
                    )}

                    {/* Quick Action Button for instant testing */}
                    <button
                      type="button"
                      style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleStatusChange(application._id, "Shortlisted")
                      }
                    >
                      Shortlist
                    </button>

                    {/* Status Dropdown */}
                    <label style={{ fontSize: "14px", color: "#4b5563" }}>
                      <select
                        value={currentStatus}
                        disabled={updatingId === application._id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontSize: "13px",
                        }}
                        onChange={(e) =>
                          handleStatusChange(application._id, e.target.value)
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {updatingId === application._id && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#2563eb",
                      marginTop: "8px",
                    }}
                  >
                    Updating status...
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Render Chat Modal overlay */}
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