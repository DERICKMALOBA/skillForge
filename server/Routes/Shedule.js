const express = require("express");
const scheduleRouter = express.Router();
const nodemailer = require("nodemailer");
const Schedule = require("../Models/ScheduleModel");
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

// Create new schedule
scheduleRouter.post("/schedule", async (req, res) => {
  try {
    const { lecturerId, studentIds, title, description, startTime, endTime } =
      req.body;

    // Validate input
    if (!lecturerId || !studentIds || !title || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new schedule
    const newSchedule = new Schedule({
      lecturer: lecturerId,
      students: studentIds,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdAt: new Date(),
    });

    await newSchedule.save();

    // Get lecturer info
    const lecturer = await Lecturer.findById(lecturerId);

    // Send emails to all students
    const students = await Student.find({ _id: { $in: studentIds } }).select("name email");

    const emailPromises = students.map(async (student) => {
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: student.email,
        subject: `New Schedule: ${title}`,
        html: `
          <h2>New Schedule Notification</h2>
          <p>Dear ${student.name},</p>
          <p> ${lecturer.title} ${lecturer.name} has scheduled a new session:</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description || "N/A"}</p>
          <p><strong>Time:</strong> ${new Date(
            startTime
          ).toLocaleString()} to ${new Date(endTime).toLocaleString()}</p>
          <p>Please make sure to attend.</p>
          <p>Best regards,</p>
          <p>Your Institution</p>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.status(201).json({
      status: "success",
      message: "Schedule created and notifications sent",
      schedule: newSchedule,
    });
  } catch (error) {
   
    res.status(500).json({
      status: "error",
      message: "Failed to create schedule",
      error: error.message,
    });
  }
});

// Get schedules for lecturer
scheduleRouter.get("/schedules/:lecturerId", async (req, res) => {
  try {
    const schedules = await Schedule.find({ lecturer: req.params.lecturerId })
      .populate("students", "name email regNumber")
      .sort({ startTime: 1 });

    res.json({ status: "success", schedules });
    
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});


// Get schedules for student (all upcoming lectures)
// Get schedules for student (all upcoming lectures)
scheduleRouter.get("/student-schedules", async (req, res) => {
  try {
    // Get current date/time
    const now = new Date();
    
    // Find all schedules that haven't happened yet
    const schedules = await Schedule.find({ 
      startTime: { $gte: now } 
    })
    .populate("lecturer", "name email")
    .sort({ startTime: 1 })
    .limit(10); // Limit to 10 upcoming lectures

    res.json({ 
      status: "success", 
      schedules: schedules.map(schedule => ({
        _id: schedule._id,
        lecturer: schedule.lecturer,
        students: schedule.students,
        title: schedule.title,
        description: schedule.description,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        createdAt: schedule.createdAt
      }))
    });
    
  } catch (error) {
    console.error("Error fetching student schedules:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
});

module.exports = scheduleRouter;
