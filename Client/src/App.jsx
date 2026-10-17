import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
  const [unreadSenderIds, setUnreadSenderIds] = useState([]); // Track senders with unread messages

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser);
      const userId = (user._id || user.id)?.toString();

      if (userId) {
        if (!socket.connected) socket.connect();
        socket.emit("join_user_room", userId);

        const handleReceiveMessage = (newMessage) => {
          const senderId = typeof newMessage.sender === "object" ? newMessage.sender?._id : newMessage.sender;

          if (!isDrawerOpen) {
            setHasUnreadMessages(true);
            if (senderId) {
              setUnreadSenderIds((prev) => [...new Set([...prev, String(senderId)])]);
            }
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
    setHasUnreadMessages(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Helper to clear a specific sender's unread status when opening their chat
  const handleClearSenderUnread = (senderId) => {
    setUnreadSenderIds((prev) => prev.filter((id) => id !== String(senderId)));
  };

  return (
    <Router>
      <Navbar
        onOpenMessages={handleOpenDrawer}
        hasUnreadMessages={hasUnreadMessages}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["student", "recruiter"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <MessageDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        unreadSenderIds={unreadSenderIds}
        onSelectConversation={handleClearSenderUnread}
      />
    </Router>
  );
}

export default App;