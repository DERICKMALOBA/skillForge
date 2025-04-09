// Models/MessageModel.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, required: true },
  fromRole: {
    type: String,
    required: true,
    enum: ["student", "lecturer", "HOD"],
  },
  fromName: { type: String, required: true },
  fromRegNumber: {
    type: String,
    required: function () {
      return this.fromRole === "student";
    },
  },
  to: { type: mongoose.Schema.Types.ObjectId, required: true },
  toRole: {
    type: String,
    required: true,
    enum: ["student", "lecturer", "HOD"],
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
});

module.exports = mongoose.model("Message", MessageSchema);
