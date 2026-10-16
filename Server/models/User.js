const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: function () {
        // Password is only required if the user didn't use Google
        return !this.googleId; 
      }
    },
    role: { 
      type: String, 
      enum: ['student', 'recruiter'], 
      default: 'student' 
    },
    googleId: { 
      type: String,
      default: null 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);