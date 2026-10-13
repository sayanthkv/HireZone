const express = require("express");

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Recruiter-only routes
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
