
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get("/jobs");
        setJobs(response.data.jobs || []);
      } catch (error) {
        setError(error.response?.data?.message || "Could not load jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.company} ${job.location}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesType = jobType === "All" || job.jobType === jobType;

    return matchesSearch && matchesType;
  });

  return (
    <main className="home-page">
      <section className="hero">
        <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>
        <h1>Find work that moves you forward.</h1>
        <p>
          Discover jobs and internships. Connect your skills with your next
          opportunity on HireHub.
        </p>

        <div className="search-bar">
          <input
            aria-label="Search jobs"
            placeholder="Search title, company or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by job type"
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
          >
            <option value="All">All types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </section>

      <section className="jobs-section">
        <div className="section-heading">
          <div>
            <h2>Latest opportunities</h2>
            <p>Explore the latest jobs posted by recruiters.</p>
          </div>
          <span>{filteredJobs.length} jobs</span>
        </div>

        {loading && <p>Loading jobs...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="empty-state">
            <h3>No jobs found</h3>
            <p>Try another keyword or check back later.</p>
          </div>
        )}

        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job._id}>
              <div className="job-card-top">
                <div className="company-avatar">
                  {(job.company || "H").charAt(0).toUpperCase()}
                </div>
                <span className="job-type">{job.jobType}</span>
              </div>

              <h3>{job.title}</h3>
              <p className="company-name">{job.company}</p>
              <p className="job-location">📍 {job.location}</p>
              <p className="job-salary">{job.salary || "Salary not specified"}</p>

              <p className="job-description">
                {job.description.length > 130
                  ? `${job.description.slice(0, 130)}...`
                  : job.description}
              </p>

              <div className="skill-list">
                {(job.skills || []).slice(0, 4).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              
{user?.role === "student" ? (
  <Link
    to={`/apply/${job._id}`}
    className="job-apply-link"
  >
    Apply now →
  </Link>
) : !user ? (
  <Link to="/login" className="job-apply-link">
    Login to apply →
  </Link>
) : (
  <p className="job-apply-note">
    Student accounts can apply for jobs.
  </p>
)}

            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
