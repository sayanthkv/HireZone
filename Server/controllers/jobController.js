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

    if (!title || !company || !location || !description) {
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

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
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

    res.status(200).json({
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({ job });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

module.exports = { createJob, getJobs, getJobById };