const express = require("express");
const HodRouter = express.Router();

const Lecturer = require("../Models/LecturerModel");
const Student = require("../Models/Student");
const Course = require("../Models/CourseModel");
const Announcement = require("../Models/Announcements"); // Import Announcement model

// Fetch all lecturers (or filter if needed)
HodRouter.get("/lecturers", async (req, res) => {
  try {
    const lecturers = await Lecturer.find({}); // Empty object fetches all
    res.json(lecturers);
    // console.log(lecturers)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lecturers" });
  }
});

// Fetch all students (or filter if needed)
HodRouter.get("/students", async (req, res) => {
  try {
    const students = await Student.find({}); // Empty object fetches all
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Assign Lecturer to Course (Improved)
HodRouter.post("/assign", async (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;

    // Validate input
    if (!courseId || !lecturerId) {
      return res.status(400).json({ message: "Course ID and Lecturer ID are required" });
    }

    // Check if both course and lecturer exist
    const [course, lecturer] = await Promise.all([
      Course.findById(courseId),
      Lecturer.findById(lecturerId)
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!lecturer || lecturer.role !== "lecturer") {
      return res.status(404).json({ message: "Lecturer not found or invalid role" });
    }

    // Update both course and lecturer documents
    await Promise.all([
      Course.findByIdAndUpdate(courseId, { lecturer: lecturerId }),
      Lecturer.findByIdAndUpdate(lecturerId, { 
        $addToSet: { courses: courseId } // Adds course to lecturer's courses array if not already present
      })
    ]);

    res.json({ 
      message: "Lecturer assigned successfully",
      course: courseId,
      lecturer: lecturerId
    });
  } catch (error) {
    console.error("Error assigning lecturer:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
});

// Add Announcement
HodRouter.post("/announcement", async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Create a new announcement
    const newAnnouncement = new Announcement({ message });
    await newAnnouncement.save();

    res.status(201).json({
      message: "Announcement added successfully",
      announcement: newAnnouncement,
    });
  } catch (error) {
    // console.error("Error adding announcement:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch All Announcements
HodRouter.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }); // Fetch announcements sorted by creation date (newest first)
    res
      .status(200)
      .json({ message: "Announcements fetched successfully", announcements });
  } catch (error) {
    // console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Download Report (Dummy Endpoint)
HodRouter.get("/report", async (req, res) => {
  res.download("sample_report.pdf"); // Replace with actual report file
});

HodRouter.post("/add-course", async (req, res) => {
  try {
    const { courseName, courseCode, lecturerId } = req.body;

    // Check if lecturer exists
    if (lecturerId) {
      const lecturer = await User.findById(lecturerId);
      if (!lecturer || lecturer.role !== "lecturer") {
        return res.status(400).json({ message: "Invalid Lecturer ID" });
      }
    }

    // Create a new course
    const newCourse = new Course({
      courseName, // Use the correct field name
      courseCode, // Use the correct field name
      lecturerId: lecturerId || null, // Assign lecturer if provided, otherwise null
    });

    // Save the course to the database
    await newCourse.save();

    res
      .status(201)
      .json({ message: "Course added successfully", course: newCourse });
  } catch (error) {
    // console.error("Error adding course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

HodRouter.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().populate("lecturerId", "name email");
    res.status(200).json({ message: "Courses fetched successfully", courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = HodRouter;
