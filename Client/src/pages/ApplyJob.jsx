import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ApplyJob.css";

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [resumeLink, setResumeLink] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);

        setJob(response.data.job || response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load this job. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || user.role !== "student") {
      setError("Only logged-in student accounts can apply.");
      return;
    }

    if (
      resumeLink.trim() &&
      !/^https?:\/\/\S+$/i.test(resumeLink.trim())
    ) {
      setError("Enter a valid resume URL starting with http:// or https://.");
      return;
    }

    try {
      setSubmitting(true);

     await api.post(`/applications/${jobId}/apply`, {
  resumeLink,
  coverLetter,
});
      setSuccess("Application submitted successfully!");

      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="apply-page-message">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="apply-page-message">
        <p>{error || "Job not found."}</p>
        <Link to="/" className="apply-back-link">
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <main className="apply-page">
      <div className="apply-container">
        <Link to="/" className="apply-back-link">
          ← Back to jobs
        </Link>

        <section className="apply-card">
          <div className="apply-heading">
            <span className="apply-eyebrow">YOUR NEXT OPPORTUNITY</span>
            <h1>Apply for this job</h1>
            <p>Review the position and submit your application.</p>
          </div>

          <div className="apply-job-summary">
            <h2>{job.title}</h2>
            <p>{job.company}</p>

            <div className="apply-job-meta">
              {job.location && <span>📍 {job.location}</span>}
              {job.jobType && <span>💼 {job.jobType}</span>}
              {job.salary && <span>💰 {job.salary}</span>}
            </div>
          </div>

          {error && (
            <div className="apply-alert apply-alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="apply-alert apply-alert-success" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="apply-form">
            <div className="apply-field">
              <label htmlFor="resumeLink">Resume URL (optional)</label>
              <input
                id="resumeLink"
                type="url"
                placeholder="https://drive.google.com/your-resume"
                value={resumeLink}
                onChange={(e) => setResumeLink(e.target.value)}
              />
              <small>
                Add a shareable link to your resume, such as Google Drive.
                Make sure the recruiter can access it.
              </small>
            </div>

            <div className="apply-field">
              <label htmlFor="coverLetter">Cover letter (optional)</label>
              <textarea
                id="coverLetter"
                rows="6"
                placeholder="Tell the recruiter why you're a good fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="apply-submit-button"
              disabled={submitting || Boolean(success)}
            >
              {submitting
                ? "Submitting..."
                : success
                  ? "Application submitted"
                  : "Submit application →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}