const mongoose = require("mongoose");
const Job = require("../models/Job");

const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      description,
      salary,
      skills,
    } = req.body;

    if (!title?.trim() || !company?.trim() ||
        !location?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: "Please provide title, company, location, and description",
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      jobType,
      description,
      salary,
      skills,
      postedBy: req.user.id,
    });

    return res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid job data",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create job",
      error: error.message,
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

const getJobById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(req.params.id)
      .populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({ job });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// Recruiter edits a job they own
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only edit your own jobs",
      });
    }

    const allowedFields = [
      "title",
      "company",
      "location",
      "jobType",
      "description",
      "salary",
      "skills",
    ];

    // Only allow approved fields to be updated.
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        job.set(field, req.body[field]);
      }
    }

    if (
      !job.title?.trim() ||
      !job.company?.trim() ||
      !job.location?.trim() ||
      !job.description?.trim()
    ) {
      return res.status(400).json({
        message: "Title, company, location, and description are required",
      });
    }

    const validJobTypes = [
      "Full-time",
      "Part-time",
      "Internship",
      "Contract",
    ];

    if (!validJobTypes.includes(job.jobType)) {
      return res.status(400).json({
        message: "Invalid job type",
      });
    }

    await job.save();

    return res.status(200).json({
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid job data",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// Recruiter deletes a job they own
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own jobs",
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
};