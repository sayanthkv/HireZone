import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
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