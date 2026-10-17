const Message = require("../models/Message");
const Application = require("../models/Application");

// Get message history for an application (Allowed only if Shortlisted or Hired)
exports.getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const application = await Application.findById(applicationId).populate("job");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify status eligibility
    if (!["Shortlisted", "Hired"].includes(application.status)) {
      return res.status(403).json({
        message: "Chat is only available for Shortlisted or Hired applicants.",
      });
    }

    // Verify user is either the student or job recruiter
    const studentId = application.student.toString();
    const recruiterId = (application.job.postedBy || application.job.recruiter)?.toString();

    if (userId !== studentId && userId !== recruiterId) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const messages = await Message.find({ application: applicationId }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to load messages", error: error.message });
  }
};