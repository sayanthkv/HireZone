const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const chatRoutes = require("./routes/chatRoutes");
const Message = require("./models/Message");
const Application = require("./models/Application");

const app = express();
const server = http.createServer(app);

// Allowed origins list (handles Render env + Vercel deployment + localhost)
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://hire-zone-eight.vercel.app",
  "http://localhost:5173",
].filter(Boolean); // removes undefined entries if CLIENT_URL is unset

// 1. Configure CORS before Helmet
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman or server-to-server calls)
      if (!origin) return callback(null, true);
      
      // Clean origin string (remove trailing slashes for comparison)
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed && allowed.replace(/\/$/, "") === cleanOrigin
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Configure Helmet (with cross-origin resource policy disabled for CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts from this IP, please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Database Connection
connectDB();

// Initialize Socket.io with production CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);

// Socket.io Real-time Handlers
io.on("connection", (socket) => {
  console.log("User connected to socket:", socket.id);

  // Join user's personal room for notification pings
  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  // Join specific application chat room
  socket.on("join_room", (applicationId) => {
    socket.join(applicationId);
    console.log(`Socket ${socket.id} joined application room: ${applicationId}`);
  });

  // Handle incoming real-time messages
  socket.on("send_message", async (data) => {
    const { applicationId, senderId, receiverId, text } = data;

    try {
      const application = await Application.findById(applicationId);

      if (application && ["Shortlisted", "Hired"].includes(application.status)) {
        const newMessage = await Message.create({
          application: applicationId,
          sender: senderId,
          receiver: receiverId,
          text,
        });

        // Broadcast to application chat room
        io.to(applicationId).emit("receive_message", newMessage);

        // Ping receiver's personal user room for navbar notification dot
        if (receiverId) {
          io.to(receiverId).emit("receive_message", newMessage);
        }
      }
    } catch (err) {
      console.error("Socket message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.json({ message: "HireZone API with Socket.io is running" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});