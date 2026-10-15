import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./HireZoneFeatures.css";

const emptyFilters = {
  search: "",
  location: "",
  jobType: "All",
  sort: "latest",
};

const PAGE_SIZE = 9;

export default function Home() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          sort: appliedFilters.sort,
        };

        if (appliedFilters.search.trim()) {
          params.search = appliedFilters.search.trim();
        }

        if (appliedFilters.location.trim()) {
          params.location = appliedFilters.location.trim();
        }

        if (appliedFilters.jobType !== "All") {
          params.jobType = appliedFilters.jobType;
        }

        const response = await api.get("/jobs", { params });

        if (cancelled) return;

        setJobs(response.data.jobs || []);
        setTotalJobs(response.data.totalJobs ?? response.data.count ?? 0);
        setTotalPages(response.data.totalPages ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load jobs");
          setJobs([]);
          setTotalJobs(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  return (
    <main className="home-page">
      <section className="hero">
        <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>
        <h1>Find work that moves you forward.</h1>
        <p>
          Discover jobs and internships. Connect your skills with your next
          opportunity on HireZone.
        </p>

        <form className="search-bar advanced-search" onSubmit={handleSearch}>
          <input
            name="search"
            aria-label="Search jobs"
            placeholder="Job title, company or skill"
            value={filters.search}
            onChange={handleFilterChange}
          />

          <input
            name="location"
            aria-label="Filter by location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
          />

          <select
            name="jobType"
            aria-label="Filter by job type"
            value={filters.jobType}
            onChange={handleFilterChange}
          >
            <option value="All">All types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>

          <select
            name="sort"
            aria-label="Sort jobs"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>

          <button className="primary-button" type="submit">
            Search
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="jobs-section">
        <div className="section-heading">
          <div>
            <h2>Latest opportunities</h2>
            <p>Explore jobs and internships posted by recruiters.</p>
          </div>
          <span>
            {totalJobs} {totalJobs === 1 ? "job" : "jobs"}
          </span>
        </div>

        {loading && <p className="loading-message">Finding opportunities...</p>}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="empty-state">
            <h3>No jobs found</h3>
            <p>Try another keyword or change your filters.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="jobs-grid">
          {jobs.map((job) => (
            <article className="job-card" key={job._id}>
              <div className="job-card-top">
                <div className="company-avatar">
                  {(job.company || "H").charAt(0).toUpperCase()}
                </div>
                <span className="job-type">{job.jobType}</span>
              </div>

              <h3>{job.title}</h3>
              <p className="company-name">{job.company}</p>
              <p className="job-location">
                📍 {job.location}
              </p>
              <p className="job-salary">
                {job.salary || "Salary not specified"}
              </p>

              <p className="job-description">
                {(job.description || "").length > 130
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

        {!loading && !error && totalPages > 1 && (
          <nav className="pagination" aria-label="Job listing pages">
            <button
              className="secondary-button"
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ← Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              className="secondary-button"
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Next →
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
