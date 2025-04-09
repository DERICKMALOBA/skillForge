const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Text submission content
  content: {
    type: String,
    trim: true
  },
  
  // File submission details
  files: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  
  // Submission status
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded', 'resubmitted'],
    default: 'submitted'
  },
  
  // Grading information
  grade: {
    score: Number,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  },
  
  // Attempt tracking
  attemptNumber: {
    type: Number,
    default: 1
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one submission per student per assignment (unless multiple attempts allowed)
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission = mongoose.model('Submission', SubmissionSchema);
module.exports = Submission;