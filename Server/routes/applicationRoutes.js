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
const { uploadResume } = require("../middleware/uploadMiddleware");

// Multer wrapper so file-type/size errors return clean 400 JSON instead of crashing
const handleResumeUpload = (req, res, next) => {
  uploadResume.single("resume")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Invalid resume file upload",
      });
    }
    next();
  });
};

// Student routes
router.post(
  "/:jobId/apply",
  protect,
  authorizeRoles("student"),
  handleResumeUpload,
  applyForJob
);

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