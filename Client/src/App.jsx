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

  // Track unread messages strictly by Application ID instead of Sender ID
  const [unreadApplicationIds, setUnreadApplicationIds] = useState([]);

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
          const senderId =
            typeof newMessage.sender === "object"
              ? newMessage.sender?._id
              : newMessage.sender;

          // 1. SENDER CHECK: Do not show red dot if WE sent the message
          if (String(senderId) === String(userId)) return;

          // Extract application ID safely from socket payload
          const appId =
            typeof newMessage.application === "object"
              ? newMessage.application?._id
              : newMessage.application || newMessage.applicationId;

          // 2. Add the specific applicationId to the unread list
          if (!isDrawerOpen) {
            setHasUnreadMessages(true);
            if (appId) {
              setUnreadApplicationIds((prev) => [
                ...new Set([...prev, String(appId)]),
              ]);
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

  // Clear unread badge for a SPECIFIC application when selected
  const handleClearApplicationUnread = (appId) => {
    setUnreadApplicationIds((prev) =>
      prev.filter((id) => id !== String(appId))
    );
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
        unreadApplicationIds={unreadApplicationIds}
        onSelectConversation={handleClearApplicationUnread}
      />
    </Router>
  );
}

export default App;