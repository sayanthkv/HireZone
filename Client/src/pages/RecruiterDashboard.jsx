
import { useEffect, useState } from "react";
import api from "../services/api";

const initialForm = {
  title: "",
  company: "",
  location: "",
  jobType: "Full-time",
  description: "",
  salary: "",
  skills: "",
};

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedJob, setSelectedJob] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchJobs = async () => {
    try {
      const response = await api.get("/jobs");
      const allJobs = response.data.jobs || [];
      const user = JSON.parse(localStorage.getItem("hirehub_user") || "null");

      const ownJobs = allJobs.filter((job) => {
        const owner = job.postedBy?._id || job.postedBy;
        return owner && user && String(owner) === String(user.id);
      });

      setJobs(ownJobs);
    } catch (error) {
      setError(error.response?.data?.message || "Could not load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      await api.post("/jobs", payload);

      setMessage("Job created successfully!");
      setForm(initialForm);
      await fetchJobs();
    } catch (error) {
      setError(error.response?.data?.message || "Could not create job");
    }
  };

  const handleViewApplicants = async (jobId) => {
    setSelectedJob(jobId);
    setApplicants([]);
    setMessage("");
    setError("");

    try {
      const response = await api.get(
        `/applications/job/${jobId}/applicants`
      );

      setApplicants(response.data.applications || []);
    } catch (error) {
      setError(error.response?.data?.message || "Could not load applicants");
    }
  };

  const handleStatusChange = async (applicationId, status) => {
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
    } catch (error) {
      setError(error.response?.data?.message || "Could not update status");
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <span className="eyebrow">RECRUITER WORKSPACE</span>
        <h1>Recruiter dashboard</h1>
        <p>Create opportunities and manage candidates.</p>
      </section>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="dashboard-panel">
        <h2>Post a new job</h2>

        <form className="job-form" onSubmit={handleCreateJob}>
          <label>
            Job title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Company
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Job type
            <select name="jobType" value={form.jobType} onChange={handleChange}>
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
            />
          </label>

          <button className="primary-button" type="submit">
            Publish job
          </button>
        </form>
      </section>

      <section className="dashboard-panel">
        <h2>My job listings</h2>

        {loading && <p>Loading jobs...</p>}
        {!loading && jobs.length === 0 && <p>You haven't posted any jobs yet.</p>}

        <div className="recruiter-job-list">
          {jobs.map((job) => (
            <article className="application-card" key={job._id}>
              <div>
                <h3>{job.title}</h3>
                <p>{job.company} · {job.location}</p>
              </div>

              <button
                className="secondary-button"
                onClick={() => handleViewApplicants(job._id)}
              >
                View applicants
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedJob && (
        <section className="dashboard-panel">
          <h2>Applicants</h2>

          {applicants.length === 0 ? (
            <p>No applicants found for this job yet.</p>
          ) : (
            <div className="applicant-list">
              {applicants.map((application) => (
                <article className="application-card" key={application._id}>
                  <div>
                    <h3>{application.student?.name}</h3>
                    <p>{application.student?.email}</p>
                    {application.resumeLink && (
                      <p>
                        <a
                          href={application.resumeLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View resume link
                        </a>
                      </p>
                    )}
                    {application.coverLetter && (
                      <p>{application.coverLetter}</p>
                    )}
                  </div>

                  <label className="status-control">
                    Status
                    <select
                      value={application.status}
                      onChange={(event) =>
                        handleStatusChange(application._id, event.target.value)
                      }
                    >
                      <option>Pending</option>
                      <option>Reviewed</option>
                      <option>Shortlisted</option>
                      <option>Rejected</option>
                      <option>Hired</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
