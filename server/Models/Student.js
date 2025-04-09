const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    registrationNumber: { 
      type: String, 
      required: [true, 'Registration number is required'], 
      unique: true,
      uppercase: true,
      trim: true
    },
    phoneNumber: { 
      type: String,
      match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
    },
    department: { 
      type: String,
      trim: true
    },
    role: { 
      type: String, 
      default: "student", 
      enum: ["student"],
      immutable: true  // Prevents role from being changed
    },
    enrolledCourses: [{  // Array of course references
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for submissions
studentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'student',
  justOne: false
});

// Indexes

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;