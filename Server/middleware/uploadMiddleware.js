const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/resumes directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files (.pdf) are allowed for resumes"), false);
  }
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max limit
  },
});

module.exports = { uploadResume, uploadDir };