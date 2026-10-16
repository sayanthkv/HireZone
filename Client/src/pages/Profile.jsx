import { useEffect, useState } from "react";
import api from "../services/api";
import "./Profile.css";

const emptyProfile = {
  name: "",
  email: "",
  role: "student",
  phone: "",
  location: "",
  city: "",
  degree: "",
  bio: "",
  skills: [],
  education: "",
  resumeLink: "",
  companyName: "",
  companyDescription: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [skillsText, setSkillsText] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/profile/me");
      const user = response.data.user;

      setProfile({
        ...emptyProfile,
        ...user,
        skills: Array.isArray(user.skills) ? user.skills : [],
      });

      setSkillsText(
        Array.isArray(user.skills) ? user.skills.join(", ") : ""
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your profile. Please log in again if your session expired."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
  name: profile.name.trim(),
  phone: profile.phone,
  location: profile.location,
  city: profile.city || profile.location, // maps city field correctly
  bio: profile.bio,
};

if (profile.role === "student") {
  payload.education = profile.education;
  payload.degree = profile.degree; // explicitly send degree
  payload.resumeLink = profile.resumeLink;
  payload.skills = skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

      const response = await api.put("/profile/me", payload);
      const updatedUser = response.data.user;

      setProfile({
        ...emptyProfile,
        ...updatedUser,
        skills: Array.isArray(updatedUser.skills)
          ? updatedUser.skills
          : [],
      });

      setSkillsText(
        Array.isArray(updatedUser.skills)
          ? updatedUser.skills.join(", ")
          : ""
      );

      const storedUser = localStorage.getItem("hirehub_user");

      if (storedUser) {
        try {
          const previousUser = JSON.parse(storedUser);

          localStorage.setItem(
            "hirehub_user",
            JSON.stringify({
              ...previousUser,
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.role,
              id: updatedUser._id,
            })
          );
        } catch {
          // The profile update itself has already succeeded.
        }
      }

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="profile-page"><p>Loading profile...</p></main>;
  }

  if (error && !profile.email) {
    return (
      <main className="profile-page">
        <div className="profile-alert profile-error">{error}</div>
        <button className="profile-button" onClick={fetchProfile}>
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="profile-heading">
            <h1>{profile.name}</h1>
            <p>{profile.email}</p>
            <span className="profile-role">
              {profile.role === "recruiter" ? "Recruiter" : "Student"}
            </span>
          </div>

          {!editing && (
            <button
              className="profile-button"
              onClick={() => {
                setMessage("");
                setError("");
                setEditing(true);
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className="profile-alert profile-success">{message}</div>
        )}

        {error && (
          <div className="profile-alert profile-error">{error}</div>
        )}

        <form onSubmit={handleSave}>
          <div className="profile-section">
            <h2>Personal Information</h2>

            <div className="profile-grid">
              <label>
                Full Name
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Email Address
                <input value={profile.email} disabled />
              </label>

              <label>
                Phone Number
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={25}
                />
              </label>

              <label>
                Location
                <input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={150}
                  placeholder="City, State"
                />
              </label>
            </div>

            <label className="profile-full-field">
              About
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!editing}
                maxLength={1000}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </label>
          </div>

          {profile.role === "student" && (
            <div className="profile-section">
              <h2>Education & Career</h2>

              <label className="profile-full-field">
                Education
                <input
                  name="education"
                  value={profile.education}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={300}
                  placeholder="Degree, college, graduation year"
                />
              </label>

              <label className="profile-full-field">
                Skills
                <input
                  value={skillsText}
                  onChange={(event) => setSkillsText(event.target.value)}
                  disabled={!editing}
                  placeholder="React, Node.js, MongoDB"
                />
                {editing && (
                  <small>Separate each skill with a comma.</small>
                )}
              </label>

              <label className="profile-full-field">
                Resume Link
                <input
                  name="resumeLink"
                  type="url"
                  value={profile.resumeLink}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={500}
                  placeholder="https://..."
                />
              </label>
            </div>
          )}

          {profile.role === "recruiter" && (
            <div className="profile-section">
              <h2>Company Information</h2>

              <label className="profile-full-field">
                Company Name
                <input
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={200}
                  placeholder="Your company"
                />
              </label>

              <label className="profile-full-field">
                Company Description
                <textarea
                  name="companyDescription"
                  value={profile.companyDescription}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={2000}
                  rows={4}
                  placeholder="Describe your company..."
                />
              </label>
            </div>
          )}

          {editing && (
            <div className="profile-actions">
              <button
                type="button"
                className="profile-button profile-secondary"
                onClick={() => {
                  setEditing(false);
                  setMessage("");
                  setError("");
                  fetchProfile();
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}