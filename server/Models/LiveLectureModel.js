const mongoose = require('mongoose');

const liveLectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References the Lecturer
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    meetingLink: {
      type: String, // URL for Peer.js video call
      required: true
    }
  },
  { timestamps: true }
);

const LiveLecture = mongoose.model('LiveLecture', liveLectureSchema);
module.exports = LiveLecture;
