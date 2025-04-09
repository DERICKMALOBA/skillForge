const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'lecturer', 'HOD'],
      required: true
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true // Required for students, optional for others
    },
    title: { type: String, enum: ["Mr", "Miss", "Prof", "Dr"], required: false },
    employeeNumber: {
      type: String,
      unique: true,
      sparse: true // Required for lecturers and HODs, not for students
    },
    department: {
      type: String,
      required: function () {
        return this.role !== 'student'; // Required for lecturers and HODs
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
