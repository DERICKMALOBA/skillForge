const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true, unique: true },
  // Rename `lecturerId` to `lecturer` for clarity (still references Lecturer)
  lecturerId: {  // Changed from 'lecturer' to 'lecturerId'
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lecturer', 
    required: false 
  },
  materials: [{  // Array of material references
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  createdAt: { type: Date, default: Date.now }
});
CourseSchema.index({ lecturers: 1 });


const Course = mongoose.model('Course', CourseSchema);
module.exports = Course;