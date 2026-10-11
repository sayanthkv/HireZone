const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { protect } = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/authorizeRoles");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();

app.use(cors());
app.use(express.json());


connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "HireHub API is running",
  });
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user
  });
});

app.get(
  "/api/auth/recruiter-test",
  protect,
  authorizeRoles("recruiter"),
  (req, res) => {
    res.json({
      message: "Welcome! You have recruiter access.",
      user: req.user
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});