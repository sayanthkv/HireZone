import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../services/api";
import "./HireZoneFeatures.css";

const statusOptions = [
  "All",
  "Pending",
  "Reviewed",
  "Shortlisted",
  "Rejected",
  "Hired",
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

const formatDate = (date) => {
  if (!date) return "Date unavailable";
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveToast, setLiveToast] = useState(null);

  // Extract logged-in student ID from localStorage OR fallback to fetched applications
  const rawUser = localStorage.getItem("user");
  const parsedUser = rawUser ? JSON.parse(rawUser) : {};
  const userObj = parsedUser.user || parsedUser;

  const studentIdFromApps =
    applications.length > 0
      ? typeof applications[0].student === "object"
        ? applications[0].student?._id
        : applications[0].student
      : "";

  const currentUserId = String(
    userObj._id || userObj.id || studentIdFromApps || ""
  );

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/applications/me");

      const appsList = Array.isArray(response.data)
        ? response.data
        : response.data.applications || [];

      setApplications(appsList);
    } catch (err) {
      setError("Failed to fetch your applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Real-time Socket.io listener for Kanban status updates
  useEffect(() => {
    if (!currentUserId) {
      console.warn(
        "⚠️ StudentDashboard: Waiting for user ID to join Socket room..."
      );
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(
        "✅ Student Socket connected:",
        socket.id,
        "| Joining room:",
        currentUserId
      );
      socket.emit("join_user_room", currentUserId);
    });

    const handleStatusUpdate = (payload) => {
      console.log("⚡ Live status update received:", payload);

      // 1. Update the matching application status in real time
      setApplications((prev) =>
        prev.map((app) =>
          String(app._id) === String(payload.applicationId)
            ? { ...app, status: payload.newStatus }
            : app
        )
      );

      // 2. Trigger live toast alert
      setLiveToast({
        title: payload.jobTitle || "Application Update",
        company: payload.company || "",
        status: payload.newStatus,
      });
    };

    socket.on("application_status_updated", handleStatusUpdate);

    return () => {
      socket.off("application_status_updated", handleStatusUpdate);
      socket.disconnect();
    };
  }, [currentUserId]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => setLiveToast(null), 6000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  const filteredApplications = useMemo(() => {
    if (selectedStatus === "All") return applications;

    return applications.filter(
      (application) => application.status === selectedStatus
    );
  }, [applications, selectedStatus]);

  const shortlistedCount = applications.filter(
    (application) => application.status === "Shortlisted"
  ).length;

  const hiredCount = applications.filter(
    (application) => application.status === "Hired"
  ).length;

  const pendingCount = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  return (
    <main className="dashboard-page">
      {/* Live Real-Time Toast Notification */}
      {liveToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "14px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            borderLeft: "4px solid #2563eb",
            maxWidth: "340px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.8px",
                color: "#60a5fa",
                textTransform: "uppercase",
              }}
            >
              ⚡ Live Status Update
            </p>
            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.4" }}>
              Your application for <strong>{liveToast.title}</strong>
              {liveToast.company ? ` at ${liveToast.company}` : ""} moved to{" "}
              <span
                style={{
                  backgroundColor: "#2563eb",
                  padding: "1px 7px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                {liveToast.status}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLiveToast(null)}
            aria-label="Close notification"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "16px",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <section className="dashboard-heading">
        <span className="eyebrow">STUDENT WORKSPACE</span>
        <h1>My applications</h1>
        <p>Keep track of your job and internship applications.</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="stat-card">
          <span>Shortlisted</span>
          <strong>{shortlistedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Hired</span>
          <strong>{hiredCount}</strong>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading-row">
          <div>
            <h2>Application history</h2>
            <p className="muted">
              Review your applications and their latest status.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={fetchApplications}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="application-filters">
          <label htmlFor="application-status-filter">
            Filter by status
          </label>

          <select
            id="application-status-filter"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All applications" : status}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="loading-message">Loading your applications...</p>}

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button
              className="inline-retry-button"
              type="button"
              onClick={fetchApplications}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="empty-state">
            <h3>You haven't applied yet</h3>
            <p>
              Explore available jobs and submit your first application.
            </p>
            <Link to="/" className="job-apply-link">
              Explore jobs →
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          applications.length > 0 &&
          filteredApplications.length === 0 && (
            <div className="empty-state">
              <h3>No applications with this status</h3>
              <p>Choose another status to view your applications.</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedStatus("All")}
              >
                Show all applications
              </button>
            </div>
          )}

        <div className="application-list">
          {!loading &&
            !error &&
            filteredApplications.map((application) => {
              const job = application.job;
              const status = application.status || "Pending";
              const statusClass = status.toLowerCase().replace(/\s+/g, "-");

              return (
                <article
                  className="application-card student-application-card"
                  key={application._id}
                >
                  <div className="student-application-info">
                    <span className="application-date">
                      Applied {formatDate(application.createdAt)}
                    </span>

                    <h3>{job?.title || "Job no longer available"}</h3>
                    <p className="company-name">
                      {job?.company || "Company unavailable"}
                    </p>

                    {job && (
                      <div className="application-job-meta">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.jobType && <span>{job.jobType}</span>}
                        {job.salary && <span>{job.salary}</span>}
                      </div>
                    )}

                    {application.resumeLink && (
                      <p className="application-resume">
                        <a
                          href={application.resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View submitted resume ↗
                        </a>
                      </p>
                    )}

                    {application.coverLetter && (
                      <details className="cover-letter-details">
                        <summary>View submitted cover letter</summary>
                        <p>{application.coverLetter}</p>
                      </details>
                    )}
                  </div>

                  <div className="student-application-status">
                    <span className={`status-pill ${statusClass}`}>
                      {status}
                    </span>
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </main>
  );
}