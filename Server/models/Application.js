const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job reference is required"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },
    resumeLink: {
      type: String,
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Shortlisted", "Rejected", "Hired"],
      default: "Pending",
    },
    // AI ATS Evaluation Fields
    aiEvaluation: {
      matchScore: { 
        type: Number, 
        default: 0 
      },
      keyStrengths: {
        type: [String],
        default: []
      },
      missingSkills: {
        type: [String],
        default: []
      },
      aiSummary: {
        type: String,
        default: ""
      },
      evaluatedAt: { 
        type: Date, 
        default: Date.now 
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);