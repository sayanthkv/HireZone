const express = require("express");
const router = express.Router();
const {
  applyForJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

// Student routes
router.post("/apply/:jobId", protect, authorizeRoles("student"), applyForJob);
router.get("/me", protect, authorizeRoles("student"), getMyApplications);

// Recruiter routes
router.get(
  "/job/:jobId/applicants",
  protect,
  authorizeRoles("recruiter"),
  getJobApplicants
);

router.patch(
  "/:applicationId/status",
  protect,
  authorizeRoles("recruiter"),
  updateApplicationStatus
);

module.exports = router;