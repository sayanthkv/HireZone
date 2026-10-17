const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const sendEmail = require("../utils/sendEmail");

// Student applies for a job
const applyForJob = async (req, res) => {
  try {
    const { resumeLink, coverLetter } = req.body;
    const { jobId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    if (resumeLink) {
      try {
        const url = new URL(resumeLink);
        if (!["http:", "https:"].includes(url.protocol)) {
          return res.status(400).json({
            message: "Resume link must use HTTP or HTTPS",
          });
        }
      } catch {
        return res.status(400).json({
          message: "Please provide a valid resume URL",
        });
      }
    }

    const job = await Job.findById(jobId).populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      student: userId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already applied for this job",
      });
    }

    const application = await Application.create({
      job: jobId,
      student: userId,
      resumeLink,
      coverLetter,
    });

    if (req.user.email) {
      sendEmail({
        to: req.user.email,
        subject: `HireZone: Application Confirmed - ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Application Received!</h2>
            <p>Hi <strong>${req.user.name || "Applicant"}</strong>,</p>
            <p>Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been submitted.</p>
            <p>Best of luck!</p>
          </div>
        `,
      }).catch((err) => console.error("Failed to send student email:", err.message));
    }

    const recruiter = job.postedBy;
    if (
      recruiter &&
      recruiter.email &&
      !recruiter.email.includes("example.com") &&
      recruiter.email !== "recruiter@gmail.com"
    ) {
      sendEmail({
        to: recruiter.email,
        subject: `HireZone: New Applicant for ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">New Applicant Alert</h2>
            <p>Hi <strong>${recruiter.name || "Recruiter"}</strong>,</p>
            <p><strong>${req.user.name || "A candidate"}</strong> (${req.user.email}) applied for <strong>${job.title}</strong>.</p>
          </div>
        `,
      }).catch((err) => console.error("Failed to send recruiter email:", err.message));
    }

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
    const userId = req.user._id || req.user.id;

    const applications = await Application.find({ student: userId })
      .populate({
        path: "job",
        populate: { path: "postedBy", select: "name email" },
      })
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
    const userId = (req.user._id || req.user.id).toString();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Safely extract raw ID string whether postedBy is populated or an ObjectId
    const jobOwnerField = job.postedBy || job.recruiter;
    const jobOwnerId = (jobOwnerField?._id || jobOwnerField)?.toString();

    if (jobOwnerId !== userId) {
      return res.status(403).json({
        message: "You can only view applicants for your own jobs",
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate("student", "name email phone location skills education resumeLink bio")
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

// Recruiter updates application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const allowedStatuses = ["Pending", "Reviewed", "Shortlisted", "Rejected", "Hired"];

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    const application = await Application.findById(applicationId).populate("student", "name email");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({ message: "Associated job not found" });
    }

    const jobOwnerField = job.postedBy || job.recruiter;
    const jobOwnerId = (jobOwnerField?._id || jobOwnerField)?.toString();

    if (jobOwnerId !== userId) {
      return res.status(403).json({
        message: "You can only update applications for your own jobs",
      });
    }

    application.status = status;
    await application.save();

    if (application.student && application.student.email) {
      sendEmail({
        to: application.student.email,
        subject: `HireZone: Status Update - ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Application Status Update</h2>
            <p>Hi <strong>${application.student.name}</strong>,</p>
            <p>Your application status for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been updated to: <strong>${status}</strong>.</p>
          </div>
        `,
      }).catch((err) => console.error("Failed to send status email:", err.message));
    }

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