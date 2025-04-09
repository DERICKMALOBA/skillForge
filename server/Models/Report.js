const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true }
});

module.exports = mongoose.model("Report", ReportSchema);
