const express = require("express");
const { createJob, getJobs } = require("../controllers/jobController");
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/", getJobs);

router.post("/", protect, authorizeRoles("recruiter"), createJob);

module.exports = router;