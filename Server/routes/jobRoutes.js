const express = require("express");

const {
  createJob,
  getJobs,
  getRecruiterJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// Public routes
router.get("/", getJobs);

// Recruiter routes (place static /my-jobs route before dynamic /:id parameter)
router.get(
  "/my-jobs",
  protect,
  authorizeRoles("recruiter"),
  getRecruiterJobs
);

router.get("/:id", getJobById);

router.post(
  "/",
  protect,
  authorizeRoles("recruiter"),
  createJob
);

router.put(
  "/:id",
  protect,
  authorizeRoles("recruiter"),
  updateJob
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("recruiter"),
  deleteJob
);

module.exports = router;