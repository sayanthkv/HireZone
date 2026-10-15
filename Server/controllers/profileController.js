const User = require("../models/User");

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "location",
      "bio",
      "skills",
      "education",
      "resumeLink",
      "companyName",
      "companyDescription",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.skills !== undefined) {
      if (!Array.isArray(updates.skills)) {
        return res.status(400).json({
          message: "Skills must be a list",
        });
      }

      updates.skills = updates.skills
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    for (const field of [
      "phone",
      "location",
      "bio",
      "education",
      "resumeLink",
      "companyName",
      "companyDescription",
    ]) {
      if (updates[field] !== undefined) {
        if (typeof updates[field] !== "string") {
          return res.status(400).json({
            message: `${field} must be text`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};