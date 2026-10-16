const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
      type: String, 
      required: function () { return !this.googleId; } 
    },
    role: { type: String, enum: ['student', 'recruiter'], default: 'student' },
    googleId: { type: String, default: null },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    location: { type: String, default: '' },
    degree: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    education: { type: String, default: '' },
    resumeLink: { type: String, default: '' },
    companyName: { type: String, default: '' },
    companyDescription: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);