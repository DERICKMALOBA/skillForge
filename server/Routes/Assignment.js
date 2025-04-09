const express = require('express');
const mongoose = require("mongoose");

const AssignmentRouter = express.Router();
const multer = require('multer');
const path = require('path');
const Lecturer = require('../Models/LecturerModel')
const fs = require('fs');
const Assignment = require('../Models/Assignment');
const Course = require('../Models/CourseModel');

const { sendAssignmentNotification } = require('../Routes/EmailServices');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|doc|docx|ppt|pptx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PPT, and PPTX files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Authentication Middleware for Lecturers
AssignmentRouter.use(async (req, res, next) => {
    try {
      // Extract credentials from headers
      const lecturerId = req.headers['lecturer-id'];
      const userRole = req.headers['x-user-role'];
  
      // Validate presence of credentials
      if (!lecturerId || lecturerId === 'undefined') {
        return res.status(401).json({ 
          success: false,
          message: "Authentication required",
          solution: "Please include your lecturer ID in the 'lecturer-id' header"
        });
      }
  
      // Verify lecturer role
      if (userRole !== 'lecturer') {
        return res.status(403).json({
          success: false,
          message: "Access forbidden",
          details: "Lecturer privileges required",
          solution: "Ensure 'x-user-role' header is set to 'lecturer'"
        });
      }
  
      // Validate ID format
      if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
          expected: "Valid MongoDB ObjectId",
          received: lecturerId
        });
      }
  
      // Verify lecturer exists
      const lecturer = await Lecturer.findById(lecturerId)
        .select('-password') // Exclude sensitive data
        .populate('courses', 'courseName courseCode'); // Include basic course info
  
      if (!lecturer) {
        return res.status(404).json({
          success: false,
          message: "Lecturer account not found",
          actions: [
            "Verify your lecturer ID",
            "Contact system administration"
          ]
        });
      }
  
      // Attach lecturer to request
      req.lecturer = {
        _id: lecturer._id,
        name: lecturer.name,
        email: lecturer.email,
        courses: lecturer.courses,
        role: lecturer.role
      };
  
      next();
    } catch (error) {
      console.error('Authentication Error:', error);
      res.status(500).json({
        success: false,
        message: "Authentication system error",
        error: error.message,
        troubleshooting: [
          "Try again later",
          "Ensure headers are properly formatted",
          "Contact support if issue persists"
        ]
      });
    }
  });
  
  // Now your protected routes can use req.lecturer
  AssignmentRouter.post('/create', upload.array('files'), async (req, res) => {
    try {
      const lecturerId = req.lecturer._id;
      const { 
        courseId, // This comes from frontend as courseId
        title,
        description,
        instructions,
        dueDate,
        maxPoints,
        submissionType,
        allowedFileTypes,
        maxFileSize,
        allowMultipleAttempts,
        notifyStudents
      } = req.body;
  
      // Verify lecturer is assigned to this course
      const isAssigned = req.lecturer.courses.some(course => 
        course._id.equals(courseId)
      );
  
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this course"
        });
      }
  
      // Create the assignment with proper field mapping
      const assignment = await Assignment.create({
        course: courseId, // Map courseId to course field
        title,
        description,
        instructions,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        submissionType: submissionType || 'both',
        fileRequirements: {
          allowedTypes: allowedFileTypes ? 
            allowedFileTypes.split(',').map(ext => ext.trim()) : 
            ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
          maxSize: maxFileSize || 10
        },
        attachments: req.files?.map(file => ({
          originalName: file.originalname,
          fileName: file.filename,
          path: `/uploads/assignments/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype
        })) || [],
        allowMultipleAttempts: allowMultipleAttempts || false,
        createdBy: lecturerId,
        lecturer: lecturerId
      });
  
      // Update course with new assignment
      await Course.findByIdAndUpdate(courseId, {
        $push: { assignments: assignment._id }
      });
  
      res.status(201).json({
        success: true,
        data: assignment
      });
  
    } catch (error) {
      console.error('Assignment Creation Error:', error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create assignment',
        error: error.message
      });
    }
  });

// Get assignments for a course
AssignmentRouter.get('/course/:courseId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .sort('-createdAt')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
});

// Get single assignment
AssignmentRouter.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'courseName courseCode')
      .populate('createdBy', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment'
    });
  }
});

// Update assignment
AssignmentRouter.put('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment'
    });
  }
});

// Delete assignment
AssignmentRouter.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Remove assignment reference from course
    await Course.updateOne(
      { _id: assignment.course },
      { $pull: { assignments: assignment._id } }
    );

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment'
    });
  }
});

module.exports = AssignmentRouter;