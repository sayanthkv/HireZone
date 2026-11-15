import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ApplyJob.css";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const validateAndSelectFile = (file) => {
    if (!file) return;
    setError("");

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF (.pdf) files are supported for resume uploads.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Resume PDF must be smaller than 5 MB.");
      return;
    }

    setResumeFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSelectFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSelectFile(file);
  };

  const clearSelectedFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || user.role !== "student") {
      setError("Only logged-in student accounts can apply.");
      return;
    }

    if (
      !resumeFile &&
      resumeLink.trim() &&
      !/^https?:\/\/\S+$/i.test(resumeLink.trim())
    ) {
      setError("Enter a valid resume URL starting with http:// or https://.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }
      if (resumeLink.trim()) {
        formData.append("resumeLink", resumeLink.trim());
      }
      if (coverLetter.trim()) {
        formData.append("coverLetter", coverLetter.trim());
      }

      await api.post(`/applications/${jobId}/apply`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Application submitted & analyzed by AI!");

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
            <p>
              Upload your PDF resume for instant AI ATS skill matching and
              submit your application.
            </p>
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
            {/* PDF Resume Drag & Drop / File Picker */}
            <div className="apply-field">
              <label htmlFor="resumePdf">
                Upload Resume (PDF, max 5 MB — Recommended for AI Match)
              </label>

              <input
                ref={fileInputRef}
                id="resumePdf"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {!resumeFile ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging
                      ? "2px dashed #2563eb"
                      : "2px dashed #cbd5e1",
                    backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
                    borderRadius: "10px",
                    padding: "22px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#0f172a",
                    }}
                  >
                    📄 Click to choose a PDF resume or drag & drop here
                  </p>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    PDF format only • Up to 5 MB
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13.5px",
                        fontWeight: "600",
                        color: "#1e3a8a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      📎 {resumeFile.name}
                    </p>
                    <span style={{ fontSize: "11.5px", color: "#3b82f6" }}>
                      {(resumeFile.size / 1024).toFixed(1)} KB • Ready for AI
                      ATS scan
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Optional External Resume Link Fallback */}
            <div className="apply-field">
              <label htmlFor="resumeLink">
                Or paste external Resume / Portfolio URL (optional)
              </label>
              <input
                id="resumeLink"
                type="url"
                placeholder="https://drive.google.com/your-resume"
                value={resumeLink}
                onChange={(e) => setResumeLink(e.target.value)}
                disabled={Boolean(resumeFile)}
              />
              <small>
                {resumeFile
                  ? "Using your uploaded PDF resume above. Remove the file if you prefer pasting a link."
                  : "Add a shareable link to your resume (Google Drive, LinkedIn, or portfolio) if not uploading a PDF."}
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
                ? "Analyzing resume & submitting..."
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