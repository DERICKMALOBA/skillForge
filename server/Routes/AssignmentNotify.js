const express = require("express");
const AssignmentNotify = express.Router();
const nodemailer = require("nodemailer");

// Import Mongoose Models
const Lecturer = require("../Models/LecturerModel");
const Student = require("../Models/Student");
const Course = require("../Models/CourseModel");

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  logger: true,
  debug: true
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
  
  } else {
  
  }
});

// POST route to send assignment emails
AssignmentNotify.post("/send-assignment", async (req, res) => {
 

  try {
    const { lecturerId, studentIds, title, description, dueDate, assignmentId, courseId } = req.body;

    // Validate input
    if (!lecturerId || !studentIds || !title || !dueDate || !courseId) {
      console.error("Validation Error: Missing required fields");
      return res.status(400).json({ 
        error: "Missing required fields (lecturerId, studentIds, title, dueDate, courseId)",
        receivedFields: Object.keys(req.body)
      });
    }

    // Get course info
    const course = await Course.findById(courseId).select("courseName");
    if (!course) {
      console.error("Course not found with ID:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    // Get lecturer info
    const lecturer = await Lecturer.findById(lecturerId).select("name title email");
    if (!lecturer) {
    
      return res.status(404).json({ message: "Lecturer not found" });
    }

    // Get students info
    const students = await Student.find({ _id: { $in: studentIds } }).select("name email");
    if (students.length === 0) {
    
      return res.status(404).json({ message: "No students found" });
    }

    // Prepare email content
    const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailPromises = students.map(async (student) => {
      const mailOptions = {
        from: {
          name: `${lecturer.title} ${lecturer.name}`,
          address: process.env.EMAIL_USERNAME
        },
        to: student.email,
        subject: `[${course.courseName}] New Assignment: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Assignment Notification</h2>
            <p>Dear ${student.name},</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #3498db;">${title}</h3>
              <p><strong>Course:</strong> ${course.courseName}</p>
              <p><strong>Instructor:</strong> ${lecturer.title} ${lecturer.name}</p>
              ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
              <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            </div>
            
            <p>Please log in to the learning management system to view and submit the assignment.</p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Best regards,</p>
              <p>${lecturer.title} ${lecturer.name}<br>
              ${course.courseName} Instructor</p>
            </div>
          </div>
        `,
        text: `
          New Assignment Notification\n
          Dear ${student.name},\n\n
          ${lecturer.title} ${lecturer.name} has posted a new assignment for ${course.courseName}:\n\n
          Title: ${title}\n
          ${description ? `Description: ${description}\n` : ''}
          Due Date: ${formattedDueDate}\n\n
          Please log in to the learning management system to view and submit the assignment.\n\n
          Best regards,\n
          ${lecturer.title} ${lecturer.name}\n
          ${course.courseName} Instructor
        `
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${student.email}:`, info.messageId);
        return { success: true, email: student.email, messageId: info.messageId };
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error.message };
      }
    });

    // Execute email sending with timeout - CORRECTED VERSION
  // Execute email sending with timeout - CORRECTED VERSION
const results = await Promise.all(emailPromises.map(p => 
  Promise.race([
    p,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout')), 30000)
    )
  ]).catch(e => ({ success: false, error: e.message }))
));


    const successfulEmails = results.filter(r => r.success);
    const failedEmails = results.filter(r => !r.success);

    // Prepare response
    const response = {
      status: successfulEmails.length > 0 ? "partial" : "failed",
      message: successfulEmails.length > 0 ? 
        `Notifications sent to ${successfulEmails.length} of ${students.length} students` : 
        "Failed to send all notifications",
      emailsSent: successfulEmails.length,
      emailsFailed: failedEmails.length,
      failedRecipients: failedEmails.map(f => f.email)
    };

    if (failedEmails.length > 0) {
      console.warn("Failed emails:", failedEmails);
      response.failedDetails = failedEmails.map(f => ({
        email: f.email,
        error: f.error
      }));
    }

    return res.status(failedEmails.length === 0 ? 200 : 207).json(response);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = AssignmentNotify;