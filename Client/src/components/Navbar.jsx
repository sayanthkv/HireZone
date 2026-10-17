import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ onOpenMessages, hasUnreadMessages = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="hz-navbar-wrapper">
      <nav className="hz-navbar">
        {/* Stylized Brand Name */}
        <Link to="/" className="hz-brand" onClick={closeMenu}>
          <span className="hz-brand-text">
            Hire<span className="hz-brand-accent"><b>Zone</b></span>
          </span>
        </Link>

        {/* Mobile Hamburger Toggle */}
<button
  type="button"
  className="hz-hamburger"
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  aria-label="Toggle navigation menu"
>
  <span className={`hz-bar ${isMobileMenuOpen ? "open" : ""}`} />
  <span className={`hz-bar ${isMobileMenuOpen ? "open" : ""}`} />
  <span className={`hz-bar ${isMobileMenuOpen ? "open" : ""}`} />
  
  {/* Red Ping Dot on Mobile Hamburger Icon when menu is collapsed */}
  {hasUnreadMessages && !isMobileMenuOpen && (
    <span className="hz-unread-ping hz-hamburger-ping" />
  )}
</button>

        {/* Collapsible Container for Mobile */}
        <div className={`hz-nav-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          {/* Navigation Links */}
          <div className="hz-nav-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "hz-nav-item active" : "hz-nav-item"
              }
              end
              onClick={closeMenu}
            >
              Find Jobs
            </NavLink>

            {user?.role === "student" && (
              <NavLink
                to="/student-dashboard"
                className={({ isActive }) =>
                  isActive ? "hz-nav-item active" : "hz-nav-item"
                }
                onClick={closeMenu}
              >
                My Dashboard
              </NavLink>
            )}

            {user?.role === "recruiter" && (
              <NavLink
                to="/recruiter-dashboard"
                className={({ isActive }) =>
                  isActive ? "hz-nav-item active" : "hz-nav-item"
                }
                onClick={closeMenu}
              >
                Recruiter Workspace
              </NavLink>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="hz-nav-actions">
            {!user ? (
              <>
                <Link to="/login" className="hz-btn-secondary" onClick={closeMenu}>
                  Log In
                </Link>
                <Link to="/register" className="hz-btn-primary" onClick={closeMenu}>
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Messages Trigger */}
                <button
                  type="button"
                  className="hz-messages-trigger"
                  onClick={() => {
                    closeMenu();
                    onOpenMessages();
                  }}
                  title="Open Messages"
                >
                  <span className="hz-msg-icon">💬</span>
                  <span className="hz-msg-label">Messages</span>
                  {hasUnreadMessages && <span className="hz-unread-ping" />}
                </button>

                <div className="hz-divider" />

                {/* User Profile Capsule Integrated with Profile Link */}
                <Link
                  to="/profile"
                  className="hz-user-capsule"
                  title="View My Profile"
                  onClick={closeMenu}
                >
                  <div className="hz-avatar">{getInitials(user.name)}</div>
                  <span className="hz-user-name">{user.name}</span>
                  <svg
                    className="hz-profile-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  className="hz-logout-btn"
                  onClick={handleLogout}
                  title="Log Out"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}