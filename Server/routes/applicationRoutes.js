const express = require("express");
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");

// Student applies for a job
router.post("/:jobId/apply", protect, applyForJob);

// Student views their own applications
router.get("/me", protect, getMyApplications);

// Recruiter views applicants for a job
router.get("/job/:jobId", protect, getJobApplicants);

// Recruiter updates status of an application
router.put("/:applicationId/status", protect, updateApplicationStatus);

module.exports = router;