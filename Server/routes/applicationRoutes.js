
const express = require("express");

const {
  applyForJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// Student routes
router.post(
  "/job/:jobId",
  protect,
  authorizeRoles("student"),
  applyForJob
);

router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyApplications
);

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
