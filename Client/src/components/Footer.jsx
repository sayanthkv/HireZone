import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        borderTop: "1px solid #1e293b",
        padding: "40px 24px 24px 24px",
        marginTop: "auto",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "32px",
          paddingBottom: "32px",
          borderBottom: "1px solid #1e293b",
        }}
      >
        {/* Brand Column */}
        <div>
          <h2
            style={{
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: "700",
              margin: "0 0 12px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#2563eb" }}>Hire</span>Zone
          </h2>
          <p
            style={{
              lineHeight: "1.6",
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Connecting candidates with top recruiters through direct real-time messaging and automated candidate tracking.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4
            style={{
              color: "#f8fafc",
              fontSize: "14px",
              fontWeight: "600",
              margin: "0 0 12px 0",
            }}
          >
            Navigation
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <li>
              <Link to="/" style={linkStyle}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/student-dashboard" style={linkStyle}>
                Jobs & Applications
              </Link>
            </li>
            <li>
              <Link to="/profile" style={linkStyle}>
                Profile Settings
              </Link>
            </li>
          </ul>
        </div>

        {/* Tech Stack Column */}
        <div>
          <h4
            style={{
              color: "#f8fafc",
              fontSize: "14px",
              fontWeight: "600",
              margin: "0 0 12px 0",
            }}
          >
            Powered By
          </h4>
          <p
            style={{
              lineHeight: "1.6",
              margin: 0,
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            MERN Stack (MongoDB, Express, React, Node.js), Socket.io WebSockets, and Nodemailer Services.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} HireZone. Built as a full-stack MERN project.
        </p>
        <p style={{ margin: 0 }}>
          Developed with Softroniics Institute
        </p>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: "#94a3b8",
  textDecoration: "none",
  transition: "color 0.2s",
};