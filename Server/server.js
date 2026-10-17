const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { protect } = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/authorizeRoles");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// Updated CORS configuration for production deployment
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Connect Database
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);

// Root Health Check Route for Render
app.get("/", (req, res) => {
  res.json({
    message: "HireZone API is running",
  });
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

app.get(
  "/api/auth/recruiter-test",
  protect,
  authorizeRoles("recruiter"),
  (req, res) => {
    res.json({
      message: "Welcome! You have recruiter access.",
      user: req.user,
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});