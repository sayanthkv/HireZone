const Message = require("../models/Message");
const Application = require("../models/Application");
const sendEmail = require("../utils/sendEmail");

// Get message history for an application
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
    const studentId = (application.student._id || application.student).toString();
    const recruiterId = (
      application.job.postedBy?._id ||
      application.job.postedBy ||
      application.job.recruiter
    )?.toString();

    if (userId !== studentId && userId !== recruiterId) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const messages = await Message.find({
      $or: [{ application: applicationId }, { applicationId }],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return res
      .status(500)
      .json({ message: "Failed to load messages", error: error.message });
  }
};

// Send a new message & notify student via email on first recruiter message
exports.sendMessage = async (req, res) => {
  try {
    const { applicationId, application, receiverId, receiver, text } = req.body;
    const appId = applicationId || application;
    const recId = receiverId || receiver;
    const senderId = (req.user._id || req.user.id).toString();

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }

    if (!appId) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    // Count existing messages for this application thread
    const existingCount = await Message.countDocuments({
      $or: [{ application: appId }, { applicationId: appId }],
    });

    const newMessage = await Message.create({
      application: appId,
      applicationId: appId,
      sender: senderId,
      receiver: recId,
      text: text.trim(),
    });

    // Send email alert ONLY on the first recruiter-initiated message
    if (existingCount === 0 && req.user.role === "recruiter") {
      const appDoc = await Application.findById(appId)
        .populate("student", "name email")
        .populate("job", "title company");

      if (appDoc?.student?.email) {
        sendEmail({
          to: appDoc.student.email,
          subject: `HireZone: New Message Regarding ${appDoc.job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">New Recruiter Message!</h2>
              <p>Hi <strong>${appDoc.student.name}</strong>,</p>
              <p>The recruiter for <strong>${appDoc.job.title}</strong> at <strong>${appDoc.job.company}</strong> has initiated a conversation with you on HireZone.</p>
              <p>Log in to your dashboard to view and reply to the message.</p>
            </div>
          `,
        }).catch((err) =>
          console.error("Failed to send chat alert email:", err.message)
        );
      }
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error details:", error);
    return res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};