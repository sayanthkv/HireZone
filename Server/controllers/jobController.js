
const mongoose = require("mongoose");
const Job = require("../models/Job");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validJobTypes = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
];

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

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof company !== "string" ||
      !company.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        message:
          "Please provide title, company, location, and description",
      });
    }

    if (jobType && !validJobTypes.includes(jobType)) {
      return res.status(400).json({
        message: "Invalid job type",
      });
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({
        message: "Skills must be an array",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      jobType: jobType || "Full-time",
      description: description.trim(),
      salary: salary || "Not specified",
      skills: skills || [],
      postedBy: req.user.id,
    });

    return res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
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
    const {
      search = "",
      location = "",
      jobType = "",
      sort = "latest",
      page = "1",
      limit = "10",
    } = req.query;

    if (
      typeof search !== "string" ||
      typeof location !== "string" ||
      typeof jobType !== "string" ||
      typeof sort !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid query parameters",
      });
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        message: "Invalid page or limit",
      });
    }

    const filter = {};

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      filter.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          company: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (location.trim()) {
      const safeLocation = escapeRegex(location.trim());

      filter.location = {
        $regex: safeLocation,
        $options: "i",
      };
    }

    if (jobType && jobType !== "All") {
      if (!validJobTypes.includes(jobType)) {
        return res.status(400).json({
          message: "Invalid job type",
        });
      }

      filter.jobType = jobType;
    }

    const sortOptions = {
      latest: { createdAt: -1, _id: -1 },
      oldest: { createdAt: 1, _id: 1 },
      title: { title: 1, _id: 1 },
    };

    if (!Object.prototype.hasOwnProperty.call(sortOptions, sort)) {
      return res.status(400).json({
        message: "Invalid sort option",
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [jobs, totalJobs] = await Promise.all([
      Job.find(filter)
        .populate("postedBy", "name email")
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      count: jobs.length,
      totalJobs,
      page: pageNumber,
      totalPages: Math.ceil(totalJobs / limitNumber),
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
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id).populate(
      "postedBy",
      "name email"
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({ job });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.postedBy.toString() !== String(req.user.id)) {
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

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        job.set(field, req.body[field]);
      }
    }

    if (
      typeof job.title !== "string" ||
      !job.title.trim() ||
      typeof job.company !== "string" ||
      !job.company.trim() ||
      typeof job.location !== "string" ||
      !job.location.trim() ||
      typeof job.description !== "string" ||
      !job.description.trim()
    ) {
      return res.status(400).json({
        message:
          "Title, company, location, and description are required",
      });
    }

    if (!validJobTypes.includes(job.jobType)) {
      return res.status(400).json({
        message: "Invalid job type",
      });
    }

    if (!Array.isArray(job.skills)) {
      return res.status(400).json({
        message: "Skills must be an array",
      });
    }

    job.title = job.title.trim();
    job.company = job.company.trim();
    job.location = job.location.trim();
    job.description = job.description.trim();

    await job.save();

    return res.status(200).json({
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
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

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.postedBy.toString() !== String(req.user.id)) {
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
