
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// Student applies for a job
const applyForJob = async (req, res) => {
  try {
    const { resumeLink, coverLetter } = req.body;
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      student: req.user.id,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied for this job",
      });
    }

    const application = await Application.create({
      job: jobId,
      student: req.user.id,
      resumeLink,
      coverLetter,
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already applied for this job",
      });
    }

    return res.status(500).json({
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

// Student views their own applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      student: req.user.id,
    })
      .populate("job")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// Recruiter views applicants for a job they own
const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only view applicants for your own jobs",
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      job: job.title,
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch applicants",
      error: error.message,
    });
  }
};

// Recruiter updates the status of an application
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Reviewed",
      "Shortlisted",
      "Rejected",
      "Hired",
    ];

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({
        message: "Associated job not found",
      });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only update applications for your own jobs",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update application status",
      error: error.message,
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
};
