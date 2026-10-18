import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { socket } from "../utils/socket";

export default function ChatModal({
  applicationId,
  currentUserId,
  receiverId,
  applicantName,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/chat/${applicationId}`);
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load message history."
      );
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial REST API Fetch
  useEffect(() => {
    if (applicationId) {
      fetchMessages();
    }
  }, [applicationId]);

  // 2. Real-Time Socket.io Connection & Room Handling
  useEffect(() => {
    if (!applicationId || !socket) return;

    // Join the specific application chat room
    socket.emit("join_room", applicationId);

    // Handler for incoming messages broadcast by backend
    const handleReceiveMessage = (newMessage) => {
      const msgAppId =
        typeof newMessage.application === "object"
          ? newMessage.application?._id
          : newMessage.application;

      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender?._id
          : newMessage.sender;

      // Filter 1: Check application room alignment
      // Filter 2: Ignore messages sent by ourselves (prevent local duplicate render)
      if (
        String(msgAppId) === String(applicationId) &&
        String(senderId) !== String(currentUserId)
      ) {
        setMessages((prevMessages) => {
          const isDuplicate = prevMessages.some(
            (msg) => msg._id && newMessage._id && msg._id === newMessage._id
          );
          if (isDuplicate) return prevMessages;
          return [...prevMessages, newMessage];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [applicationId, currentUserId]);

  // 3. Auto Scroll on Message Array Update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Send Message Handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    try {
      setSending(true);
      setError("");

      const response = await api.post("/chat/send", {
        applicationId,
        receiverId,
        text: text.trim(),
      });

      // Append sent message locally (Optimistic state update)
      setMessages((prev) => {
        const isDuplicate = prev.some((msg) => msg._id === response.data._id);
        return isDuplicate ? prev : [...prev, response.data];
      });

      // Emit socket event for real-time broadcast to the receiver
      if (socket) {
        socket.emit("send_message", {
          applicationId,
          senderId: currentUserId,
          receiverId,
          text: text.trim(),
        });
      }

      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          height: "600px",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Conversation with {applicantName}
            </h3>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              HireZone Candidate Direct Messaging
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#9ca3af",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Thread Body */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {loading && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Loading conversation...
            </p>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "10px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && messages.length === 0 && !error && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              <p style={{ margin: 0, fontWeight: "500" }}>No messages yet</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                Send a message below to start the discussion regarding interview
                scheduling or application updates.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const senderId =
              typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
            const isMe = String(senderId) === String(currentUserId);

            return (
              <div
                key={msg._id || idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: isMe
                      ? "16px 16px 2px 16px"
                      : "16px 16px 16px 2px",
                    backgroundColor: isMe ? "#2563eb" : "#ffffff",
                    color: isMe ? "#ffffff" : "#1f2937",
                    border: isMe ? "none" : "1px solid #e2e8f0",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {msg.text}
                </div>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "4px",
                    padding: "0 4px",
                  }}
                >
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "20px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={sending || !text.trim()}
            style={{
              backgroundColor: text.trim() ? "#2563eb" : "#94a3b8",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "20px",
              border: "none",
              fontWeight: "600",
              fontSize: "14px",
              cursor: text.trim() ? "pointer" : "default",
            }}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}