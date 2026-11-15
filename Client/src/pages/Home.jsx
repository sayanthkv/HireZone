import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./HireZoneFeatures.css";

const baseFilters = {
  search: "",
  location: "",
  jobType: "All",
  sort: "latest",
};

const PAGE_SIZE = 9;

export default function Home() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [studentSkills, setStudentSkills] = useState([]);
  const [skillsLoaded, setSkillsLoaded] = useState(false);

  const [filters, setFilters] = useState(baseFilters);
  const [appliedFilters, setAppliedFilters] = useState(baseFilters);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Load up-to-date student skills when logged in as a student
  useEffect(() => {
    let cancelled = false;

    const loadStudentSkills = async () => {
      if (!isStudent) {
        setStudentSkills([]);
        setSkillsLoaded(true);
        return;
      }

      const initialSkills = Array.isArray(user?.skills) ? user.skills : [];
      if (initialSkills.length > 0) {
        setStudentSkills(initialSkills);
        setFilters((prev) => ({ ...prev, sort: "recommended" }));
        setAppliedFilters((prev) => ({ ...prev, sort: "recommended" }));
      }

      try {
        const res = await api.get("/profile/me");
        if (cancelled) return;

        const profileData = res.data?.user || res.data || {};
        const latestSkills = Array.isArray(profileData.skills)
          ? profileData.skills.filter(Boolean)
          : initialSkills;

        setStudentSkills(latestSkills);

        if (latestSkills.length > 0) {
          setFilters((prev) => ({ ...prev, sort: "recommended" }));
          setAppliedFilters((prev) => ({ ...prev, sort: "recommended" }));
        }
      } catch {
        // Fallback silently to AuthContext skills if profile fetch fails
      } finally {
        if (!cancelled) setSkillsLoaded(true);
      }
    };

    loadStudentSkills();

    return () => {
      cancelled = true;
    };
  }, [isStudent, user]);

  // 2. Fetch jobs ranked by student skills when applicable
  useEffect(() => {
    if (!skillsLoaded) return;

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

        if (isStudent && studentSkills.length > 0) {
          params.skills = studentSkills.join(",");
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
  }, [appliedFilters, page, isStudent, studentSkills, skillsLoaded]);

  const normalizedSkillSet = useMemo(
    () => new Set(studentSkills.map((s) => s.trim().toLowerCase())),
    [studentSkills]
  );

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
    const defaultSort =
      isStudent && studentSkills.length > 0 ? "recommended" : "latest";
    const reset = { ...baseFilters, sort: defaultSort };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const isRecommendedView =
    isStudent &&
    studentSkills.length > 0 &&
    appliedFilters.sort === "recommended";

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
            {isStudent && studentSkills.length > 0 && (
              <option value="recommended">Best skill match</option>
            )}
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
        {/* Student Skill Personalization Banner */}
        {isStudent && skillsLoaded && studentSkills.length > 0 && (
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "13.5px", color: "#1e3a8a" }}>
              <strong>🎯 Personalized for your skills:</strong>{" "}
              <span>{studentSkills.slice(0, 6).join(", ")}</span>
              {studentSkills.length > 6 && (
                <span> +{studentSkills.length - 6} more</span>
              )}
            </div>
            <Link
              to="/profile"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              Update skills →
            </Link>
          </div>
        )}

        {isStudent && skillsLoaded && studentSkills.length === 0 && (
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "13.5px", color: "#475569" }}>
              Add your technical skills to see jobs tailored to your profile at
              the top.
            </span>
            <Link
              to="/profile"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              Add skills →
            </Link>
          </div>
        )}

        <div className="section-heading">
          <div>
            <h2>
              {isRecommendedView
                ? "Recommended for your skills"
                : "Latest opportunities"}
            </h2>
            <p>
              {isRecommendedView
                ? "Jobs ranked highest based on your profile skills."
                : "Explore jobs and internships posted by recruiters."}
            </p>
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
          {jobs.map((job) => {
            const hasSkillMatch =
              isStudent &&
              typeof job.matchPercentage === "number" &&
              job.matchPercentage > 0;

            return (
              <article
                className="job-card"
                key={job._id}
                style={
                  hasSkillMatch
                    ? { borderColor: "#93c5fd", position: "relative" }
                    : undefined
                }
              >
                <div className="job-card-top">
                  <div className="company-avatar">
                    {(job.company || "H").charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {hasSkillMatch && (
                      <span
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#1d4ed8",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "999px",
                        }}
                      >
                        🎯 {job.matchPercentage}% Match
                      </span>
                    )}
                    <span className="job-type">{job.jobType}</span>
                  </div>
                </div>

                <h3>{job.title}</h3>
                <p className="company-name">{job.company}</p>
                <p className="job-location">📍 {job.location}</p>
                <p className="job-salary">
                  {job.salary || "Salary not specified"}
                </p>

                <p className="job-description">
                  {(job.description || "").length > 130
                    ? `${job.description.slice(0, 130)}...`
                    : job.description}
                </p>

                <div className="skill-list">
                  {(job.skills || []).slice(0, 4).map((skill) => {
                    const isMatched =
                      isStudent &&
                      normalizedSkillSet.has(skill.trim().toLowerCase());

                    return (
                      <span
                        key={skill}
                        style={
                          isMatched
                            ? {
                                backgroundColor: "#dbeafe",
                                color: "#1d4ed8",
                                fontWeight: "600",
                                border: "1px solid #93c5fd",
                              }
                            : undefined
                        }
                      >
                        {isMatched ? `✓ ${skill}` : skill}
                      </span>
                    );
                  })}
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
            );
          })}
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