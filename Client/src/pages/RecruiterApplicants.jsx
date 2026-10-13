import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
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

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/applications/job/${jobId}/applicants`
        );

        const data = response.data;
        setApplicants(
          Array.isArray(data) ? data : data.applications || data.applicants || []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load applicants."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      await api.patch(`/applications/${applicationId}/status`, {
        status,
      });

      setApplicants((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update application status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <main className="recruiter-applicants-page">
        <p>Loading applicants...</p>
      </main>
    );
  }

  return (
    <main className="recruiter-applicants-page">
      <div className="recruiter-applicants-container">
        <Link
          to="/recruiter-dashboard"
          className="applicants-back-link"
        >
          ← Back to dashboard
        </Link>

        <header className="applicants-header">
          <div>
            <p className="applicants-eyebrow">RECRUITER WORKSPACE</p>
            <h1>Job Applicants</h1>
            <p>Review candidates and manage their applications.</p>
          </div>

          <div className="applicants-count">
            <strong>{applicants.length}</strong>
            <span>Applicants</span>
          </div>
        </header>

        {error && (
          <div className="applicants-error" role="alert">
            {error}
          </div>
        )}

        {applicants.length === 0 && !error ? (
          <section className="applicants-empty">
            <h2>No applicants yet</h2>
            <p>
              When students apply for this job, their applications
              will appear here.
            </p>
          </section>
        ) : (
          <section className="applicants-list">
            {applicants.map((application) => {
              const student = application.student || {};

              return (
                <article
                  className="applicant-card"
                  key={application._id}
                >
                  <div className="applicant-card-header">
                    <div className="applicant-avatar">
                      {(student.name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="applicant-identity">
                      <h2>{student.name || "Student"}</h2>
                      <p>{student.email || "No email available"}</p>
                    </div>

                    <span
                      className={`applicant-status status-${(
                        application.status || "Pending"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {application.status || "Pending"}
                    </span>
                  </div>

                  {application.coverLetter && (
                    <div className="applicant-cover-letter">
                      <h3>Cover Letter</h3>
                      <p>{application.coverLetter}</p>
                    </div>
                  )}

                  <div className="applicant-card-footer">
                    {application.resumeLink ? (
                      <a
                        href={application.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="applicant-resume-link"
                      >
                        View Resume ↗
                      </a>
                    ) : (
                      <span className="applicant-no-resume">
                        No resume provided
                      </span>
                    )}

                    <label className="applicant-status-control">
                      <span>Update status</span>

                      <select
                        value={application.status || "Pending"}
                        disabled={updatingId === application._id}
                        onChange={(e) =>
                          handleStatusChange(
                            application._id,
                            e.target.value
                          )
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {updatingId === application._id && (
                    <p className="applicant-updating">
                      Updating status...
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}