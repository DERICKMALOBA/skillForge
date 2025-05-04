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
    
  
    try {
      const { lecturerId, studentIds, title, description, startTime, endTime } = req.body;
  
    
  
      // Validate input
      if (!lecturerId || !studentIds || !title || !startTime || !endTime) {
     
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Get lecturer info
    
      const lecturer = await Lecturer.findById(lecturerId);
   
  
   
      const students = await Student.find({ _id: { $in: studentIds } }).select("name email");
   
  
  
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
  
       
        return transporter.sendMail(mailOptions)
          .then(info => {
           
            return info;
          })
          .catch(err => {
          
            throw err;
          });
      });
  
   
      await Promise.all(emailPromises);
     
  
      res.status(201).json({
        status: "success",
        message: "Notifications sent",
        emailsSent: students.length
      });
    } catch (error) {
     
      
      res.status(500).json({
        status: "error",
        message: "Failed to send notifications",
        error: error.message,
      });
    }
  });



module.exports = NotifyRouter;
