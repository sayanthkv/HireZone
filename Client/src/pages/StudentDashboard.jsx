import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/applications/my");
      setApplications(response.data.applications || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

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
