const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../Models/Student");
const Lecturer = require("../Models/LecturerModel");
const Hod = require("../Models/HodModel");
require("dotenv").config();

const router = express.Router();


// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Basic validation: Ensure email, password, and role are provided
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Please provide email, password, and role" });
    }

    // Validate role
    const validRoles = ["student", "lecturer", "HOD"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Find user by role
    let user;
    switch (role) {
      case "student":
        user = await Student.findOne({ email });
        break;
      case "lecturer":
        user = await Lecturer.findOne({ email });
        break;
      case "HOD":
        user = await Hod.findOne({ email });
        break;
      default:
        return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check if user exists
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Send response with user details and token
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        phoneNumber: user.phoneNumber,
        department: user.department,
        ...(role === "student" && { registrationNumber: user.registrationNumber }),
        ...((role === "lecturer" || role === "HOD") && {
          title: user.title,
          employeeNumber: user.employeeNumber,
        }),
      },
      token,
    });
  } catch (error) {
    console.log("role", role)
    console.log("token", token)
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});


router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      registrationNumber,
      employeeNumber,
      department,
      title,
      phoneNumber
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !role || !department || !phoneNumber) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    // Role-specific validation
    if (role === "student" && !registrationNumber) {
      return res.status(400).json({ message: "Registration number is required for students" });
    }

    if ((role === "lecturer" || role === "HOD") && (!employeeNumber || !title)) {
      return res.status(400).json({ message: "Employee number and title are required for staff" });
    }

    // Validate role
    const validRoles = ["student", "lecturer", "HOD"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Check if email exists in any model
    const [studentEmail, lecturerEmail, hodEmail] = await Promise.all([
      Student.findOne({ email }),
      Lecturer.findOne({ email }),
      Hod.findOne({ email })
    ]);

    if (studentEmail || lecturerEmail || hodEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check for duplicate registrationNumber or employeeNumber
    if (role === "student") {
      const existingReg = await Student.findOne({ registrationNumber });
      if (existingReg) {
        return res.status(400).json({ message: "Registration number already in use" });
      }
    } else {
      const existingEmp = await (role === "lecturer"
        ? Lecturer.findOne({ employeeNumber })
        : Hod.findOne({ employeeNumber }));

      if (existingEmp) {
        return res.status(400).json({ message: "Employee number already in use" });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Common fields
    const commonFields = {
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      department
    };

    // Create new user based on role
    let newUser;
    switch (role) {
      case "student":
        newUser = new Student({
          ...commonFields,
          registrationNumber
        });
        break;
      case "lecturer":
        newUser = new Lecturer({
          ...commonFields,
          employeeNumber,
          title
        });
        break;
      case "HOD":
        newUser = new Hod({
          ...commonFields,
          employeeNumber,
          title
        });
        break;
      default:
        // This shouldn't happen due to previous validation, but just in case
        return res.status(400).json({ message: "Invalid role specified" });
    }

    // Save user and handle duplicate errors
    try {
      await newUser.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate field value detected" });
      }
      throw err;
    }

    // Generate JWT
    const token = jwt.sign({ id: newUser._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // Log information (removed the undefined error log)
    console.log("role", role);
    console.log("token", token);

    // Send single response
    res.status(201).json({
      message: "User registered successfully!",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role,
        phoneNumber: newUser.phoneNumber,
        department: newUser.department,
        ...(role === "student" && { registrationNumber: newUser.registrationNumber }),
        ...((role === "lecturer" || role === "HOD") && {
          title: newUser.title,
          employeeNumber: newUser.employeeNumber
        })
      },
      token
    });

  } catch (error) {
    console.error("Registration error:", error);
    // Check if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error. Please try again." });
    }
  }
});

module.exports = router;
