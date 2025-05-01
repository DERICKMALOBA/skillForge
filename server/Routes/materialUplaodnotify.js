const express = require("express");
const NotifyRouter = express.Router();
const nodemailer = require("nodemailer");
const Lecturer = require("../Models/LecturerModel");
const Student = require("../Models/Student");

// Configure NodeMailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 
NotifyRouter.post("/notify", async (req, res) => {
    console.log("=== NOTIFICATION REQUEST RECEIVED ===");
    console.log("Headers:", req.headers);
    console.log("Request Body:", req.body);
  
    try {
      const { lecturerId, studentIds, title, description, startTime, endTime } = req.body;
  
      // Log received data
      console.log("Parsed Data:", {
        lecturerId,
        studentIdsCount: studentIds?.length || 0,
        title,
        descriptionLength: description?.length || 0,
        startTime,
        endTime
      });
  
      // Validate input
      if (!lecturerId || !studentIds || !title || !startTime || !endTime) {
        console.error("Validation Error: Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Get lecturer info
      console.log("Fetching lecturer info for ID:", lecturerId);
      const lecturer = await Lecturer.findById(lecturerId);
      console.log("Lecturer found:", lecturer ? lecturer.name : "Not found");
  
      // Send emails to all students
      console.log("Fetching students with IDs:", studentIds);
      const students = await Student.find({ _id: { $in: studentIds } }).select("name email");
      console.log("Students found:", students.length);
  
      // Log email transporter configuration
      console.log("Email Transporter Config:", {
        service: transporter.options.service,
        authUser: transporter.options.auth.user,
        authPass: transporter.options.auth.pass ? "***" : "undefined"
      });
  
      const emailPromises = students.map(async (student) => {
        const mailOptions = {
          from: process.env.EMAIL_USERNAME,
          to: student.email,
          subject: `Material Upload Notification: ${title}`,
          html: `
            <h2>Material Upload Notification</h2>
            <p>Dear ${student.name},</p>
            <p>${lecturer.title} ${lecturer.name} has uploaded new materials for the course:</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description || "N/A"}</p>
            <p><strong>Time:</strong> ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}</p>
            <p>Please make sure to review the materials.</p>
            <p>Best regards,</p>
          `,
        };
  
        console.log("Preparing to send email to:", student.email);
        return transporter.sendMail(mailOptions)
          .then(info => {
            console.log(`Email sent to ${student.email}:`, info.messageId);
            return info;
          })
          .catch(err => {
            console.error(`Failed to send email to ${student.email}:`, err);
            throw err;
          });
      });
  
      console.log("Starting to send all emails...");
      await Promise.all(emailPromises);
      console.log("All emails sent successfully");
  
      res.status(201).json({
        status: "success",
        message: "Notifications sent",
        emailsSent: students.length
      });
    } catch (error) {
      console.error("Full Error:", error);
      console.error("Error Stack:", error.stack);
      
      res.status(500).json({
        status: "error",
        message: "Failed to send notifications",
        error: error.message,
      });
    }
  });



module.exports = NotifyRouter;
