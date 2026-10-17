import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onOpenMessages, hasUnreadMessages = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Hire<span>Zone</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Find Jobs</Link>

        {!user && <Link to="/register">Register</Link>}
        {!user && (
          <Link to="/login" className="nav-button">
            Login
          </Link>
        )}

        {user?.role === "student" && (
          <Link to="/student-dashboard">My Dashboard</Link>
        )}

        {user?.role === "recruiter" && (
          <Link to="/recruiter-dashboard">Recruiter Dashboard</Link>
        )}

        {user && (
          <>
            {/* Messages Overlay Trigger with Red Notification Ping */}
            <button
              type="button"
              className="messages-nav-button"
              onClick={onOpenMessages}
              style={{
                position: "relative",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#1f2937",
              }}
            >
              💬 Messages
              {hasUnreadMessages && (
                <span
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    width: "10px",
                    height: "10px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    border: "2px solid #ffffff",
                  }}
                />
              )}
            </button>

            <Link to="/profile" className="profile-nav-button">
              My Profile
            </Link>

            <span className="welcome-user">Hi, {user.name}</span>

            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}