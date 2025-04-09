const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema({
  message: { type: String, required: true }, // Announcement message
  createdAt: { type: Date, default: Date.now }, // Timestamp of creation
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);