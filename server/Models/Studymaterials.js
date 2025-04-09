const mongoose = require("mongoose");
const StudyMaterialsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Lecturer", required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model("StudyMaterial", StudyMaterialsSchema);
  