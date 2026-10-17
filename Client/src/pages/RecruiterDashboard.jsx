import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./HireZoneFeatures.css";
import { useAuth } from "../context/AuthContext";
import ChatModal from "../components/ChatModal";

const initialForm = {
  title: "",
  company: "",
  location: "",
  jobType: "Full-time",
  description: "",
  salary: "",
  skills: "",
};

const statusOptions = [
  "Pending",
  "Reviewed",
  "Shortlisted",
  "Rejected",
  "Hired",
];

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingJobId, setEditingJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState("");
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();

  const currentUserId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    try {
      setError("");

      const response = await api.get("/jobs?limit=100");

      const allJobs = Array.isArray(response.data.jobs)
        ? response.data.jobs
        : [];

      const userId =
        user?._id ||
        user?.id ||
        user?.user?._id ||
        user?.user?.id;

      if (!userId) {
        setJobs([]);
        setError(
          "Unable to identify the logged-in recruiter. Please log out and log in again."
        );
        return;
      }

      const ownJobs = allJobs.filter((job) => {
        const ownerId =
          typeof job.postedBy === "object"
            ? job.postedBy?._id
            : job.postedBy;

        return (
          ownerId &&
          String(ownerId) === String(userId)
        );
      });

      setJobs(ownJobs);
    } catch (err) {
      setJobs([]);

      if (err.code === "ECONNABORTED") {
        setError(
          "The server took too long to respond. Please try again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Could not load jobs."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchJobs();
    }
  }, [authLoading, fetchJobs]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    jobType: form.jobType,
    description: form.description.trim(),
    salary: form.salary.trim() || "Not specified",
    skills: form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  });

  const resetForm = () => {
    setForm(initialForm);
    setEditingJobId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingJobId) {
        await api.put(`/jobs/${editingJobId}`, payload);
        setMessage("Job updated successfully.");
      } else {
        await api.post("/jobs", payload);
        setMessage("Job published successfully.");
      }

      resetForm();
      await fetchJobs();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingJobId ? "Could not update job" : "Could not create job")
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (job) => {
    setForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      jobType: job.jobType || "Full-time",
      description: job.description || "",
      salary:
        job.salary === "Not specified" ? "" : job.salary || "",
      skills: (job.skills || []).join(", "),
    });

    setEditingJobId(job._id);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteJob = async (job) => {
    const confirmed = window.confirm(
      `Delete "${job.title}" at ${job.company}?\n\nThis removes the job listing. Existing applications may remain in the database.`
    );

    if (!confirmed) return;

    setDeletingJobId(job._id);
    setMessage("");
    setError("");

    try {
      await api.delete(`/jobs/${job._id}`);

      setJobs((previous) =>
        previous.filter((item) => item._id !== job._id)
      );

      if (editingJobId === job._id) {
        resetForm();
      }

      if (selectedJob === job._id) {
        setSelectedJob("");
        setApplicants([]);
      }

      setMessage("Job deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete job");
    } finally {
      setDeletingJobId("");
    }
  };

  const handleViewApplicants = async (jobId) => {
    setSelectedJob(jobId);
    setApplicants([]);
    setApplicantsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.get(
        `/applications/job/${jobId}/applicants`
      );

      setApplicants(response.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load applicants");
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, status) => {
    setUpdatingApplicationId(applicationId);
    setMessage("");
    setError("");

    try {
      await api.patch(`/applications/${applicationId}/status`, { status });

      setApplicants((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application
        )
      );

      setMessage("Application status updated.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update application status"
      );
    } finally {
      setUpdatingApplicationId("");
    }
  };

  const selectedJobTitle =
    jobs.find((job) => job._id === selectedJob)?.title || "Selected job";

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <span className="eyebrow">RECRUITER WORKSPACE</span>
        <h1>Recruiter dashboard</h1>
        <p>Create opportunities and manage candidates.</p>
      </section>

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-panel" id="job-editor">
        <h2>{editingJobId ? "Edit job listing" : "Post a new job"}</h2>

        <form className="job-form" onSubmit={handleSubmit}>
          <label>
            Job title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </label>

          <label>
            Company
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </label>

          <label>
            Job type
            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </label>

          <label>
            Salary
            <input
              name="salary"
              value={form.salary}
              onChange={handleChange}
              placeholder="e.g. ₹15,000 per month"
              maxLength={100}
            />
          </label>

          <label>
            Skills (comma separated)
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              maxLength={10000}
            />
          </label>

          <div className="form-actions full-width">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingJobId
                  ? "Save changes"
                  : "Publish job"}
            </button>

            {editingJobId && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading-row">
          <div>
            <h2>My job listings</h2>
            <p className="muted">{jobs.length} jobs posted by you</p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={fetchJobs}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading jobs...</p>}

        {!loading && jobs.length === 0 && (
          <div className="empty-state">
            <h3>No job listings yet</h3>
            <p>Publish your first opportunity using the form above.</p>
          </div>
        )}

        <div className="recruiter-job-list">
          {jobs.map((job) => (
            <article className="application-card recruiter-job-card" key={job._id}>
              <div className="recruiter-job-info">
                <span className="job-type">{job.jobType}</span>
                <h3>{job.title}</h3>
                <p>{job.company} · {job.location}</p>
                <p className="muted">
                  Posted{" "}
                  {job.createdAt
                    ? new Date(job.createdAt).toLocaleDateString()
                    : "date unavailable"}
                </p>
              </div>

              <div className="recruiter-job-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => startEditing(job)}
                >
                  Edit
                </button>

                <button
                  className="danger-button"
                  type="button"
                  onClick={() => handleDeleteJob(job)}
                  disabled={deletingJobId === job._id}
                >
                  {deletingJobId === job._id ? "Deleting..." : "Delete"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleViewApplicants(job._id)}
                >
                  View applicants
                </button>

                {/* Fixed Route URL to match App.jsx */}
                <Link
                  to={`/recruiter/job/${job._id}/applicants`}
                  className="text-link"
                >
                  Open applicants page →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedJob && (
        <section className="dashboard-panel">
          <div className="panel-heading-row">
            <div>
              <h2>Applicants</h2>
              <p className="muted">{selectedJobTitle}</p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedJob("");
                setApplicants([]);
              }}
            >
              Close
            </button>
          </div>

          {applicantsLoading && <p>Loading applicants...</p>}

          {!applicantsLoading && applicants.length === 0 && (
            <div className="empty-state">
              <h3>No applicants yet</h3>
              <p>Applications for this job will appear here.</p>
            </div>
          )}

          <div className="applicant-list">
            {applicants.map((application) => {
              const student = application.student || {};
              const studentId = student._id || student.id || student;
              const receiverId = typeof studentId === "object" ? studentId._id : studentId;
              const currentStatus = String(application.status || "Pending").trim();
              const isChatEligible =
                currentStatus.toLowerCase() === "shortlisted" ||
                currentStatus.toLowerCase() === "hired";

              return (
                <article className="application-card" key={application._id}>
                  <div className="applicant-details">
                    <h3>{student?.name || "Student"}</h3>
                    <p>{student?.email || "Email unavailable"}</p>

                    <p className="muted">
                      Applied{" "}
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString()
                        : "date unavailable"}
                    </p>

                    {application.resumeLink && (
                      <p>
                        <a
                          href={application.resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View resume ↗
                        </a>
                      </p>
                    )}

                    {application.coverLetter && (
                      <details className="cover-letter-details">
                        <summary>Read cover letter</summary>
                        <p>{application.coverLetter}</p>
                      </details>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                    {/* Render Chat Button directly inside Dashboard view */}
                    {isChatEligible && (
                      <button
                        type="button"
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontWeight: "600",
                          fontSize: "13px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedChat({
                            applicationId: application._id,
                            receiverId,
                            applicantName: student?.name || "Student",
                          })
                        }
                      >
                        💬 Message Candidate
                      </button>
                    )}

                    <label className="status-control">
                      Application status
                      <select
                        value={application.status}
                        disabled={updatingApplicationId === application._id}
                        onChange={(event) =>
                          handleStatusChange(application._id, event.target.value)
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      {updatingApplicationId === application._id && (
                        <span className="muted">Updating...</span>
                      )}
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Render Chat Modal Overlay */}
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