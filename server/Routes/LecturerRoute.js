const nodemailer = require("nodemailer");
const express = require("express");
const LecturerRouter = express.Router();
const Lecturer = require("../Models/LecturerModel");
const Course = require("../Models/CourseModel");
const Material = require("../Models/MaterialModel");
const Announcement = require("../Models/Announcements");
const mongoose = require('mongoose');
const Student = require("../Models/Student");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);


// Example using Gmail - replace with your SMTP config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME, // e.g., your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD, // App-specific password if using Gmail
  },
});

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/materials');
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
  const filetypes = /pdf|docx?|ppt|pptx|xlsx?|jpg|jpeg|png|gif|mp4|mov|avi|zip/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only document, presentation, spreadsheet, image, video, and archive files are allowed'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

// Improved Authentication Middleware
LecturerRouter.use(async (req, res, next) => {
  try {
    // Check headers in multiple cases (case-insensitive)
    const lecturerId = req.headers['lecturer-id'] || 
                      req.headers['Lecturer-Id'] || 
                      req.headers['LECTURER-ID'];
    
    const userRole = req.headers['x-user-role'] || 
                    req.headers['X-User-Role'];

    console.log('Auth Middleware - Received headers:', {
      lecturerId,
      userRole,
      allHeaders: req.headers
    });

    if (!lecturerId || lecturerId === 'undefined') {
      return res.status(401).json({ 
        message: "Authentication required",
        solution: "Please include your lecturer ID in headers as 'Lecturer-Id'"
      });
    }

    if (userRole?.toLowerCase() !== 'lecturer') {
      return res.status(403).json({
        message: "Access forbidden",
        details: "Lecturer privileges required",
        receivedRole: userRole
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lecturerId)) {
      return res.status(400).json({
        message: "Invalid ID format",
        expected: "MongoDB ObjectId",
        received: lecturerId
      });
    }

    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer account not found",
        actions: ["Contact administration"],
        searchedId: lecturerId
      });
    }

    req.lecturer = lecturer;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    res.status(500).json({
      message: "Authentication system error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Materials Upload Endpoint
// Materials Upload Endpoint with Email Notifications
LecturerRouter.post("/materials", upload.array('files'), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({
      message: "No files uploaded",
      solution: "Please select at least one file"
    });
  }

  let metadata;
  try {
    metadata = JSON.parse(req.body.metadata);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid metadata format",
      details: "Metadata should be a valid JSON string"
    });
  }

  const { courseId, title, description, module, tags, visibility, availableFrom, availableTo } = metadata;

  if (!courseId || !title) {
    await Promise.all(req.files.map(file => unlinkAsync(file.path)));
    return res.status(400).json({
      message: "Missing required fields",
      required: ["courseId", "title"]
    });
  }

  try {
    // Validate lecturer's access to the course
    const isValidCourse = req.lecturer.courses.some(course => 
      course.toString() === courseId
    );

    if (!isValidCourse) {
      await Promise.all(req.files.map(file => unlinkAsync(file.path)));
      return res.status(403).json({
        message: "Course access denied",
        details: "You are not assigned to this course",
        debug: {
          requestedCourse: courseId,
          yourCourses: req.lecturer.courses
        }
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      await Promise.all(req.files.map(file => unlinkAsync(file.path)));
      return res.status(404).json({
        message: "Course not found",
        details: "The specified course does not exist"
      });
    }

    // Process each file
    const materials = await Promise.all(req.files.map(async (file) => {
      const material = new Material({
        course: course._id,
        lecturer: req.lecturer._id,
        originalName: file.originalname,
        storagePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        title,
        description,
        module,
        tags: Array.isArray(tags) ? tags : (tags?.split(',').map(tag => tag.trim()) || []),
        visibility: visibility || 'public',
        availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
        availableTo: availableTo ? new Date(availableTo) : null,
        license: metadata.license || "educational"
      });

      await material.save();
      
      await Course.findByIdAndUpdate(
        course._id,
        { $push: { materials: material._id } },
        { new: true }
      );

      return {
        id: material._id,
        title: material.title,
        type: material.mimeType,
        size: material.fileSize
      };
    }));

    // Send success response first
    res.status(201).json({
      success: true,
      message: `${materials.length} material(s) uploaded successfully`,
      count: materials.length,
      materials
    });

    // Then send email notifications to enrolled students (non-blocking)
    const enrolledStudents = await Student.find({ courses: course._id }).select("email name").lean();

    if (enrolledStudents.length > 0) {
      const emailPromises = enrolledStudents.map(student => {
        const mailOptions = {
          from: `"${req.lecturer.name}" <${process.env.EMAIL_USERNAME}>`,
          to: student.email,
          subject: `📚 New Material Uploaded: ${title} - ${course.courseName}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">New Course Material Available</h2>
              <p>Dear ${student.name},</p>
              
              <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;">
                <p><strong>Course:</strong> ${course.courseName} (${course.courseCode})</p>
                <p><strong>Lecturer:</strong> ${req.lecturer.name}</p>
                <p><strong>Material Title:</strong> ${title}</p>
                ${module ? `<p><strong>Module:</strong> ${module}</p>` : ''}
                ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
              </div>
              
              <p>This material is now available in your course portal. Please log in to access it.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>${process.env.INSTITUTION_NAME || 'University LMS'} Team</strong>
              </p>
              
              <div style="margin-top: 20px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px;">
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          `
        };

        return transporter.sendMail(mailOptions)
          .then(info => {
            console.log(`Email sent to ${student.email}: ${info.messageId}`);
            return info;
          })
          .catch(err => {
            console.error(`Failed to send to ${student.email}:`, err.message);
            return null;
          });
      });

      // Process emails in background
      Promise.all(emailPromises)
        .then(results => {
          const successful = results.filter(r => r !== null).length;
          console.log(`Notifications sent: ${successful}/${enrolledStudents.length}`);
        })
        .catch(err => {
          console.error('Error processing email notifications:', err);
        });
    }

  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files) {
      await Promise.all(req.files.map(file => unlinkAsync(file.path).catch(console.error)));
    }
    
    console.error('Upload error:', error);
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});



// Courses Endpoint

LecturerRouter.get("/my-courses", async (req, res) => {
  try {
    const lecturer = req.lecturer;
    
    // Populate courses directly from lecturer document
    const result = await Lecturer.findById(lecturer._id)
      .populate({
        path: 'courses',
        select: 'courseName courseCode description',
        options: { lean: true }
      })
      .select('courses')
      .lean();

    if (!result?.courses?.length) {
      return res.status(404).json({
        message: "No courses assigned",
        actions: ["Contact department head"],
        lecturerId: lecturer._id
      });
    }

    res.json(result.courses);
  } catch (error) {
    console.error('Courses Fetch Error:', error);
    res.status(500).json({
      message: "Failed to fetch courses",
      error: error.message,
      debug: process.env.NODE_ENV === 'development' ? {
        lecturerId: req.lecturer?._id,
        stack: error.stack
      } : undefined
    });
  }
});
  
  // Get announcements relevant to lecturers
  LecturerRouter.get("/my-announcements", async (req, res) => {
    try {
      const announcements = await Announcement.find({
        $or: [
          { audience: "all" },
          { audience: "lecturers" },
          { departments: req.lecturer.department } // If you have department-specific announcements
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10) // Only get the 10 most recent
      .select("message createdAt audience") // Only return necessary fields
      .lean();
  
      res.json(announcements);
    } catch (error) {
      console.error("Announcements fetch error:", error);
      res.status(500).json({ 
        message: "Failed to fetch announcements",
        error: error.message 
      });
    }
  });
// Add these to your existing LecturerRouter

// Get chat participants for a course
LecturerRouter.get("/chat/participants/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the lecturer is assigned to this course
    const course = await Course.findOne({
      _id: courseId,
      lecturers: req.lecturer._id
    });
    
    if (!course) {
      return res.status(403).json({
        message: "Not authorized to access this course chat"
      });
    }
    
    // Get students enrolled in this course
    const participants = await Student.find({ courses: courseId })
      .select("name email")
      .lean();
      
    // Add lecturer info
    const lecturerInfo = await Lecturer.findById(req.lecturer._id)
      .select("name email")
      .lean();
      
    participants.unshift({
      ...lecturerInfo,
      role: "lecturer"
    });
    
    res.json(participants);
  } catch (error) {
    console.error("Error fetching chat participants:", error);
    res.status(500).json({
      message: "Failed to fetch chat participants",
      error: error.message
    });
  }
});

// Get message history for a course
LecturerRouter.get("/chat/messages/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Verify course access
    const course = await Course.findOne({
      _id: courseId,
      lecturers: req.lecturer._id
    });
    
    if (!course) {
      return res.status(403).json({
        message: "Not authorized to access this course chat"
      });
    }
    
    const query = { courseId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
      
    res.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      message: "Failed to fetch chat messages",
      error: error.message
    });
  }
});
module.exports = LecturerRouter;