const express = require("express");
const router = express.Router();
const { getMessages, sendMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/chat/:applicationId
router.get("/:applicationId", protect, getMessages);

// POST /api/chat/send
router.post("/send", protect, sendMessage);

module.exports = router;