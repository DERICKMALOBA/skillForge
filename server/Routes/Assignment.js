const express = require('express');
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const AssignmentRouter = express.Router();
const multer = require('multer');
const path = require('path');
const Lecturer = require('../Models/LecturerModel')
const fs = require('fs');
const Assignment = require('../Models/Assignment');
const Course = require('../Models/CourseModel');
const Student =require("../Models/Student")




const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

// Verify transporter connection (added)
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send messages');
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

  AssignmentRouter.post('/create', upload.array('files'), async (req, res) => {
    try {
        const lecturerId = req.lecturer?._id || req.body.lecturerId;
        const {
            courseId,
            title,
            description,
            instructions,
            dueDate,
            maxPoints,
            submissionType,
            allowedFileTypes,
            maxFileSize,
            allowMultipleAttempts,
            notifyStudents,
            studentIds // Array of student IDs to notify
        } = req.body;

        // Validate required fields
        if (!courseId || !title || !dueDate || !lecturerId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields (courseId, title, dueDate, lecturerId)"
            });
        }

        // Validate lecturer exists
        const lecturer = await Lecturer.findById(lecturerId)
            .select('title name email')
            .lean();
        if (!lecturer) {
            return res.status(404).json({
                success: false,
                message: "Lecturer not found"
            });
        }

        // Validate course exists
        const course = await Course.findById(courseId)
            .select('courseName courseCode')
            .lean();
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Process student IDs for notification
        let studentsToNotify = [];
        if (notifyStudents === 'true' && studentIds) {
            try {
                // Handle both stringified array and direct array input
                const studentIdArray = typeof studentIds === 'string' ? 
                    JSON.parse(studentIds) : 
                    studentIds;
                
                if (Array.isArray(studentIdArray) && studentIdArray.length > 0) {
                    studentsToNotify = await Student.find({
                        _id: { $in: studentIdArray }
                    }).select('name email _id').lean();
                }
            } catch (e) {
                console.error("Error processing student IDs:", e);
                return res.status(400).json({
                    success: false,
                    message: "Invalid student IDs format",
                    error: e.message
                });
            }
        }

        // Create new assignment
      // Ensure attachments is always an array, even if there are no files
const assignment = await Assignment.create({
  course: courseId,
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
  })) || [], // Ensure attachments is always an array
  allowMultipleAttempts: allowMultipleAttempts === 'true',
  createdBy: lecturerId,
  lecturer: lecturerId,
  notifiedStudents: studentsToNotify.map(student => student._id)
});

// Add assignment to course
await Course.findByIdAndUpdate(courseId, {
  $push: { assignments: assignment._id }
});

// Notify students if requested and we have valid students
if (notifyStudents === 'true' && studentsToNotify.length > 0) {
  try {
      const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });

      // Use the same email sending approach as the schedule route
      const emailPromises = studentsToNotify.map(async (student) => {
          const mailOptions = {
              from: process.env.EMAIL_USERNAME,
              to: student.email,
              subject: `[${course.courseName}] New Assignment: ${title}`,
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #2c3e50;">New Assignment Notification</h2>
                      <p>Dear ${student.name},</p>
                      <p>${lecturer.title} ${lecturer.name} has created a new assignment:</p>
                      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                          <h3 style="margin-top: 0; color: #3498db;">${title}</h3>
                          <p><strong>Course:</strong> ${course.courseName} (${course.courseCode})</p>
                          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                          ${assignment.attachments && assignment.attachments.length > 0 ? 
                              `<p><strong>Attachments:</strong> ${assignment.attachments.length} file(s)</p>` : ''}
                      </div>
                      <p>Please log in to the learning management system to view and submit the assignment.</p>
                      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                          <p>Best regards,</p>
                          <p>${lecturer.title} ${lecturer.name}<br>${course.courseName} Instructor</p>
                      </div>
                  </div>
              `
          };

          return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);

  } catch (notificationError) {
      console.error("Notification system error:", notificationError);
  }
}


        // Add assignment to course
        await Course.findByIdAndUpdate(courseId, {
            $push: { assignments: assignment._id }
        });

        // Notify students if requested and we have valid students
        if (notifyStudents === 'true' && studentsToNotify.length > 0) {
            try {
                const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Use the same email sending approach as the schedule route
                const emailPromises = studentsToNotify.map(async (student) => {
                    const mailOptions = {
                        from: process.env.EMAIL_USERNAME, // Changed to match schedule route
                        to: student.email,
                        subject: `[${course.courseName}] New Assignment: ${title}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #2c3e50;">New Assignment Notification</h2>
                                <p>Dear ${student.name},</p>
                                <p>${lecturer.title} ${lecturer.name} has created a new assignment:</p>
                                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                    <h3 style="margin-top: 0; color: #3498db;">${title}</h3>
                                    <p><strong>Course:</strong> ${course.courseName} (${course.courseCode})</p>
                                    ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                                    <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                                    ${assignment.attachments.length > 0 ? 
                                        `<p><strong>Attachments:</strong> ${assignment.attachments.length} file(s)</p>` : ''}
                                </div>
                                <p>Please log in to the learning management system to view and submit the assignment.</p>
                                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                                    <p>Best regards,</p>
                                    <p>${lecturer.title} ${lecturer.name}<br>${course.courseName} Instructor</p>
                                </div>
                            </div>
                        `
                    };

                    return transporter.sendMail(mailOptions);
                });

                await Promise.all(emailPromises); // Use Promise.all instead of allSettled to match schedule route

            } catch (notificationError) {
                console.error("Notification system error:", notificationError);
                // Continue with response even if notifications fail
            }
        }

        res.status(201).json({
            success: true,
            data: {
                ...assignment.toObject(),
                courseName: course.courseName,
                courseCode: course.courseCode,
                lecturerName: `${lecturer.title} ${lecturer.name}`,
                notifiedStudentCount: studentsToNotify.length
            },
            message: notifyStudents === 'true' ? 
                "Assignment created and notifications sent" : 
                "Assignment created successfully"
        });

    } catch (error) {
        console.error("Assignment Creation Error:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create assignment",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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