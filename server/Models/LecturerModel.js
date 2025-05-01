const mongoose = require("mongoose");

const lecturerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    title: {
      type: String,
      enum: ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."],
      required: true,
    },
   employeeNumber: { type: String, required: true, unique: true }, 
    phoneNumber: { type: String },
    department: { type: String, required: true },
    role: { type: String, default: "lecturer", enum: ["lecturer"] },
    // Add this field:
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        default: [],
      },
    ],
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
  },
  { timestamps: true }
);
// In your LecturerModel.js
lecturerSchema.index({ courses: 1 });
const Lecturer = mongoose.model("Lecturer", lecturerSchema);
module.exports = Lecturer;
