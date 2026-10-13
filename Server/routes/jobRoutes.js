const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
} = require("../controllers/jobController");
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/", getJobs);
router.get("/:id", getJobById);

router.post("/", protect, authorizeRoles("recruiter"), createJob);

module.exports = router;