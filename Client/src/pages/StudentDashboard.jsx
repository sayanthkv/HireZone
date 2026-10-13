
import { useEffect, useState } from "react";
import api from "../services/api";

export default function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get("/applications/my");
        setApplications(response.data.applications || []);
      } catch (error) {
        setError(
          error.response?.data?.message || "Could not load applications"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <span className="eyebrow">STUDENT WORKSPACE</span>
        <h1>My applications</h1>
        <p>Keep track of your job and internship applications.</p>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="stat-card">
          <span>Shortlisted</span>
          <strong>
            {applications.filter((item) => item.status === "Shortlisted").length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Hired</span>
          <strong>
            {applications.filter((item) => item.status === "Hired").length}
          </strong>
        </div>
      </div>

      {loading && <p>Loading your applications...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && applications.length === 0 && (
        <div className="empty-state">
          <h3>You haven't applied yet</h3>
          <p>Explore available jobs and submit your first application.</p>
        </div>
      )}

      <div className="application-list">
        {applications.map((application) => (
          <article className="application-card" key={application._id}>
            <div>
              <h3>{application.job?.title || "Job no longer available"}</h3>
              <p>{application.job?.company || "Company unavailable"}</p>
              <p className="muted">
                Applied on{" "}
                {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>

            <span
              className={`status-pill ${application.status
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {application.status}
            </span>
          </article>
        ))}
      </div>
    </main>
  );
}
