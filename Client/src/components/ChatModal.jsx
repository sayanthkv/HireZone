import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
  : "http://localhost:5000";

let socket;

const ChatModal = ({ applicationId, currentUserId, receiverId, applicantName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize web socket connection
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.emit("join_room", applicationId);

    // Fetch existing chat history
    const fetchChatHistory = async () => {
      try {
        const res = await api.get(`/chat/${applicationId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchChatHistory();

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("send_message", {
      applicationId,
      senderId: currentUserId,
      receiverId,
      text,
    });

    setText("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-[500px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
          <h3 className="font-semibold">Chat with {applicantName}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">
            &times;
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, index) => {
            const isMe = msg.sender === currentUserId;
            return (
              <div
                key={msg._id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg text-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;