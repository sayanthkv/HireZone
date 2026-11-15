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

// Helper to compute skill overlap score between student skills and a job
const scoreJobForStudent = (job, normalizedStudentSkills) => {
  const rawJobSkills = [
    ...(Array.isArray(job.skills) ? job.skills : []),
    ...(Array.isArray(job.requirements) ? job.requirements : []),
  ];

  // Deduplicate job skills case-insensitively
  const uniqueJobSkills = [];
  const seen = new Set();
  for (const skill of rawJobSkills) {
    if (typeof skill === "string" && skill.trim()) {
      const lower = skill.trim().toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueJobSkills.push(skill.trim());
      }
    }
  }

  if (normalizedStudentSkills.length === 0 || uniqueJobSkills.length === 0) {
    return {
      ...job,
      matchCount: 0,
      matchPercentage: 0,
      matchedSkills: [],
    };
  }

  const matchedSkills = uniqueJobSkills.filter((jobSkill) => {
    const lowerJobSkill = jobSkill.toLowerCase();
    return normalizedStudentSkills.some(
      (studentSkill) =>
        studentSkill === lowerJobSkill ||
        lowerJobSkill.includes(studentSkill) ||
        studentSkill.includes(lowerJobSkill)
    );
  });

  // Bonus weight if a student skill appears directly in the job title
  const titleLower = (job.title || "").toLowerCase();
  const titleBonus = normalizedStudentSkills.some((s) =>
    titleLower.includes(s)
  )
    ? 0.5
    : 0;

  const matchPercentage = Math.min(
    100,
    Math.round((matchedSkills.length / uniqueJobSkills.length) * 100)
  );

  return {
    ...job,
    matchCount: matchedSkills.length + titleBonus,
    matchPercentage,
    matchedSkills,
  };
};

// Create a new job listing
const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      jobType,
      description,
      salary,
      skills,
      requirements,
    } = req.body;

    const finalJobType = type || jobType || "Full-time";
    const finalSkills =
      skills || (Array.isArray(requirements) ? requirements : []);
    const userId = req.user._id || req.user.id;

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
        message: "Please provide title, company, location, and description",
      });
    }

    if (finalJobType && !validJobTypes.includes(finalJobType)) {
      return res.status(400).json({
        message: "Invalid job type",
      });
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      type: finalJobType,
      jobType: finalJobType,
      description: description.trim(),
      salary: salary || "Not specified",
      skills: Array.isArray(finalSkills) ? finalSkills : [],
      requirements: Array.isArray(finalSkills) ? finalSkills : [],
      postedBy: userId,
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

    console.error("Create job error:", error);

    return res.status(500).json({
      message: "Failed to create job",
      error: error.message,
    });
  }
};

// Get all jobs for public / student listing (with skill-relevance ranking)
const getJobs = async (req, res) => {
  try {
    const {
      search = "",
      location = "",
      jobType = "",
      type = "",
      sort = "latest",
      skills = "",
      page = "1",
      limit = "10",
    } = req.query;

    const selectedType = jobType || type;

    if (
      typeof search !== "string" ||
      typeof location !== "string" ||
      typeof selectedType !== "string" ||
      typeof sort !== "string" ||
      typeof skills !== "string"
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

    const andConditions = [];

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());

      andConditions.push({
        $or: [
          { title: { $regex: safeSearch, $options: "i" } },
          { company: { $regex: safeSearch, $options: "i" } },
          { skills: { $regex: safeSearch, $options: "i" } },
          { requirements: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    if (location.trim()) {
      const safeLocation = escapeRegex(location.trim());

      andConditions.push({
        location: {
          $regex: safeLocation,
          $options: "i",
        },
      });
    }

    if (selectedType && selectedType !== "All") {
      if (!validJobTypes.includes(selectedType)) {
        return res.status(400).json({
          message: "Invalid job type",
        });
      }

      andConditions.push({
        $or: [{ jobType: selectedType }, { type: selectedType }],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const sortOptions = {
      latest: { createdAt: -1, _id: -1 },
      oldest: { createdAt: 1, _id: 1 },
      title: { title: 1, _id: 1 },
      recommended: { createdAt: -1, _id: -1 },
    };

    if (!Object.prototype.hasOwnProperty.call(sortOptions, sort)) {
      return res.status(400).json({
        message: "Invalid sort option",
      });
    }

    const normalizedStudentSkills = skills
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const skip = (pageNumber - 1) * limitNumber;

    // When sorting by skill relevance with student skills provided, rank across matching jobs
    if (sort === "recommended" && normalizedStudentSkills.length > 0) {
      const allMatchingJobs = await Job.find(filter)
        .populate("postedBy", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .lean();

      const scoredJobs = allMatchingJobs
        .map((job) => scoreJobForStudent(job, normalizedStudentSkills))
        .sort((a, b) => {
          if (b.matchCount !== a.matchCount) {
            return b.matchCount - a.matchCount;
          }
          if (b.matchPercentage !== a.matchPercentage) {
            return b.matchPercentage - a.matchPercentage;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      const totalJobs = scoredJobs.length;
      const paginatedJobs = scoredJobs.slice(skip, skip + limitNumber);

      return res.status(200).json({
        count: paginatedJobs.length,
        totalJobs,
        page: pageNumber,
        totalPages: Math.ceil(totalJobs / limitNumber),
        jobs: paginatedJobs,
      });
    }

    const [rawJobs, totalJobs] = await Promise.all([
      Job.find(filter)
        .populate("postedBy", "name email")
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Job.countDocuments(filter),
    ]);

    // Still attach skill match metadata if student skills were sent
    const jobs =
      normalizedStudentSkills.length > 0
        ? rawJobs.map((job) =>
            scoreJobForStudent(job, normalizedStudentSkills)
          )
        : rawJobs;

    return res.status(200).json({
      count: jobs.length,
      totalJobs,
      page: pageNumber,
      totalPages: Math.ceil(totalJobs / limitNumber),
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// Get all jobs posted by the logged-in recruiter
const getRecruiterJobs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get recruiter jobs error:", error);

    return res.status(500).json({
      message: "Failed to fetch recruiter jobs",
      error: error.message,
    });
  }
};

// Get a single job by ID
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id).populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({ job });
  } catch (error) {
    console.error("Get job by ID error:", error);

    return res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
};

// Update an existing job posting
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

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

    if (!job.postedBy || job.postedBy.toString() !== userId) {
      return res.status(403).json({
        message: "You can only edit your own jobs",
      });
    }

    const allowedFields = [
      "title",
      "company",
      "location",
      "type",
      "jobType",
      "description",
      "salary",
      "skills",
      "requirements",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        job.set(field, req.body[field]);
      }
    }

    const finalJobType = job.type || job.jobType;

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
        message: "Title, company, location, and description are required",
      });
    }

    if (finalJobType && !validJobTypes.includes(finalJobType)) {
      return res.status(400).json({
        message: "Invalid job type",
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
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid job data",
        error: error.message,
      });
    }

    console.error("Update job error:", error);

    return res.status(500).json({
      message: "Failed to update job",
      error: error.message,
    });
  }
};

// Delete a job posting
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

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

    if (!job.postedBy || job.postedBy.toString() !== userId) {
      return res.status(403).json({
        message: "You can only delete your own jobs",
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    return res.status(500).json({
      message: "Failed to delete job",
      error: error.message,
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getRecruiterJobs,
  getJobById,
  updateJob,
  deleteJob,
};