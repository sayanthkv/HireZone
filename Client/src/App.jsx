import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 1. Import the centralized socket instance used across ChatModal
import { socket } from "./utils/socket";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import MessageDrawer from "./components/MessageDrawer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import StudentDashboard from "./pages/StudentDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import ApplyJob from "./pages/ApplyJob";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser);
      const userId = (user._id || user.id)?.toString();

      if (userId) {
        // Ensure connection & join personal user room
        if (!socket.connected) socket.connect();
        socket.emit("join_user_room", userId);

        const handleReceiveMessage = (newMessage) => {
          // Trigger red dot ONLY if message drawer/modal is closed
          if (!isDrawerOpen) {
            setHasUnreadMessages(true);
          }
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
          socket.off("receive_message", handleReceiveMessage);
        };
      }
    } catch (err) {
      console.error("Auth context parse error:", err);
    }
  }, [isDrawerOpen]);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    setHasUnreadMessages(false); // Clear red dot when user opens messages
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Router>
      {/* Navbar with Messages Overlay Trigger and Notification Dot */}
      <Navbar
        onOpenMessages={handleOpenDrawer}
        hasUnreadMessages={hasUnreadMessages}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Student Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply/:jobId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ApplyJob />
            </ProtectedRoute>
          }
        />

        {/* Protected Recruiter Routes */}
        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/job/:jobId/applicants"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterApplicants />
            </ProtectedRoute>
          }
        />

        {/* Common Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["student", "recruiter"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Slide-over Right Message Drawer */}
      <MessageDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer}>
        <div style={{ padding: "10px", textAlign: "center", color: "#6b7280" }}>
          <p style={{ fontSize: "14px", fontWeight: "500" }}>Active Conversations</p>
          <p style={{ fontSize: "12px", marginTop: "8px" }}>
            Select an applicant or job conversation from your dashboard to start chatting.
          </p>
        </div>
      </MessageDrawer>
    </Router>
  );
}

export default App;