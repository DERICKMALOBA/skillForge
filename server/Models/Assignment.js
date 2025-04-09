const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  // Reference to the Course this assignment belongs to
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Basic assignment information
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  instructions: {
    type: String,
    trim: true,
    required: [true, 'Instructions are required']
  },
  
  // Submission details
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Due date must be in the future'
    }
  },
  
  maxPoints: {
    type: Number,
    required: true,
    min: [1, 'Points must be at least 1'],
    max: [1000, 'Points cannot exceed 1000'],
    default: 100
  },
  
  submissionType: {
    type: String,
    enum: ['text', 'file', 'both'],
    default: 'both'
  },
  
  // File upload requirements (conditional based on submissionType)
  fileRequirements: {
    allowedTypes: {
      type: [String],
      default: ['.pdf', '.doc', '.docx', '.ppt', '.pptx']
    },
    maxSize: { // in MB
      type: Number,
      default: 10,
      min: 1,
      max: 100
    }
  },
  
  // Attempts and grading
  allowMultipleAttempts: {
    type: Boolean,
    default: false
  },
  
  // Reference to the lecturer who created the assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable automatic timestamps
  timestamps: true,
  
  // Add virtuals when converting to JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for submissions (one-to-many relationship)
AssignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignment',
  justOne: false
});

// Indexes for better query performance
AssignmentSchema.index({ course: 1 });
AssignmentSchema.index({ createdBy: 1 });
AssignmentSchema.index({ dueDate: 1 });

// Update the course's assignments array when a new assignment is created
AssignmentSchema.post('save', async function(doc) {
  await mongoose.model('Course').updateOne(
    { _id: doc.course },
    { $addToSet: { assignments: doc._id } }
  );
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);
module.exports = Assignment;