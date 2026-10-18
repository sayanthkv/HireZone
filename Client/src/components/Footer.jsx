import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#f8fafc", // Clean light grey matching page backgrounds
        color: "#64748b",
        borderTop: "1px solid #e2e8f0", // Subtle grey border matching navbar
        padding: "40px 24px 20px 24px",
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
          paddingBottom: "28px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {/* Brand Column */}
        <div>
          <h2
            style={{
              color: "#0f172a",
              fontSize: "20px",
              fontWeight: "700",
              margin: "0 0 10px 0",
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            Direct recruiter and candidate portal powered by real-time WebSockets and automated candidate status alerts.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4
            style={{
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: "600",
              margin: "0 0 12px 0",
            }}
          >
            Quick Links
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
                Dashboard
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
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: "600",
              margin: "0 0 12px 0",
            }}
          >
            Built With
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
          paddingTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} HireZone. All rights reserved.
        </p>
        <p style={{ margin: 0, fontWeight: "500", color: "#64748b" }}>
          Developed with Softroniics Institute
        </p>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: "500",
  transition: "color 0.2s",
};