
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeLink: {
      type: String,
      trim: true,
      default: "",
    },
    coverLetter: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Shortlisted", "Rejected", "Hired"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

applicationSchema.index(
  { job: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);
