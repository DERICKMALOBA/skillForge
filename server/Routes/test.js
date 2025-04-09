require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidV4 } = require("uuid");
const { Server } = require("socket.io");

const authRoutes = require("./Routes/AuthRoute");
const HodRouter = require("./Routes/hod");
const LecturerRouter = require("./Routes/LecturerRoute");
const AssignmentRouter = require("./Routes/Assignment");
const Message = require("./Models/MessageModel"); // You'll need to create this

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hod", HodRouter)
app.use("/api/lecturer", LecturerRouter)
app.use("/api/assignments", AssignmentRouter)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Store active users and their rooms
const activeUsers = new Map();

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const userId = socket.handshake.auth.userId;
    const role = socket.handshake.auth.role;
    
    if (!userId || !role) {
      throw new Error("Authentication required");
    }
    
    // You might want to add more validation here depending on your auth system
    socket.userId = userId;
    socket.role = role;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.userId}, Role: ${socket.role})`);

  // Video streaming room handling
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // Chat message handling
  socket.on("join_chat", async ({ courseId }) => {
    try {
      // Store user's active room
      activeUsers.set(socket.id, { 
        userId: socket.userId, 
        courseId, 
        role: socket.role 
      });
      
      // Join the course-specific room
      socket.join(`chat_${courseId}`);
      console.log(`User ${socket.userId} (${socket.role}) joined course chat ${courseId}`);
      
      // Load previous messages from database
      const messages = await Message.find({ courseId })
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();
      
      socket.emit("previous_messages", messages);
    } catch (error) {
      console.error("Error joining chat:", error);
    }
  });

  socket.on("send_message", async (messageData) => {
    try {
      const { courseId, content } = messageData;
      const senderId = socket.userId;
      
      // Create and save the message
      const message = new Message({
        senderId,
        senderName: messageData.senderName,
        courseId,
        content,
        role: socket.role
      });
      
      const savedMessage = await message.save();
      
      // Broadcast to all in the course room including sender
      io.to(`chat_${courseId}`).emit("receive_message", savedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("leave_chat", ({ courseId }) => {
    socket.leave(`chat_${courseId}`);
    console.log(`User ${socket.userId} left course chat ${courseId}`);
  });

  socket.on("disconnect", () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.userId} disconnected`);
      activeUsers.delete(socket.id);
    }
  });

  // Existing video streaming events
  socket.on("chat-message", (message) => {
    io.emit("chat-message", message);
  });

  socket.on("raise-hand", ({ userId, raisedHand }) => {
    io.emit("raise-hand", { userId, raisedHand });
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));













require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidV4 } = require("uuid");
const { Server } = require("socket.io");

const authRoutes = require("./Routes/AuthRoute");
const HodRouter = require("./Routes/hod");
const LecturerRouter = require("./Routes/LecturerRoute");
const AssignmentRouter = require("./Routes/Assignment");
const Message = require("./models/Message");
const Student = require("./models/Student"); // Add these models
const Lecturer = require("./models/Lecturer"); // Add these models

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hod", HodRouter);
app.use("/api/lecturer", LecturerRouter);
app.use("/api/assignments", AssignmentRouter);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// Track connected users
const connectedUsers = new Map();

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const { userId, role, regNumber } = socket.handshake.auth;
    
    if (!userId || !role) {
      throw new Error("Authentication required");
    }
    
    // Verify user exists in database
    let user;
    if (role === 'student') {
      user = await Student.findById(userId);
    } else if (role === 'lecturer') {
      user = await Lecturer.findById(userId);
    }
    
    if (!user) throw new Error("User not found");
    
    socket.userData = {
      id: userId,
      role,
      name: user.name,
      regNumber: user.regNumber || null,
      socketId: socket.id
    };
    
    next();
  } catch (error) {
    next(new Error("Authentication failed: " + error.message));
  }
});

// ... [rest of your existing Socket.IO implementation] ...

// =============================================
// TESTING ENDPOINTS
// =============================================

// Get all connected users (for testing)
app.get("/api/test/connected-users", (req, res) => {
  const users = Array.from(connectedUsers.values()).map(user => ({
    id: user.id,
    role: user.role,
    name: user.name,
    regNumber: user.regNumber,
    socketId: user.socketId
  }));
  res.json(users);
});

// Get all messages (for testing)
app.get("/api/test/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages between specific users (for testing)
app.get("/api/test/messages/:userId1/:userId2", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.params.userId1, to: req.params.userId2 },
        { from: req.params.userId2, to: req.params.userId1 }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students (for testing)
app.get("/api/test/students", async (req, res) => {
  try {
    const students = await Student.find().select("name regNumber");
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all lecturers (for testing)
app.get("/api/test/lecturers", async (req, res) => {
  try {
    const lecturers = await Lecturer.find().select("name email department");
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate student sending message (for testing)
app.post("/api/test/send-student-message", async (req, res) => {
  try {
    const { studentId, lecturerId, content } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Student not found");
    
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new Error("Lecturer not found");
    
    const message = new Message({
      from: studentId,
      fromRole: 'student',
      fromRegNumber: student.regNumber,
      to: lecturerId,
      toRole: 'lecturer',
      content
    });
    
    const savedMessage = await message.save();
    
    // If lecturer is connected, send via socket
    const lecturerSocket = connectedUsers.get(lecturerId);
    if (lecturerSocket) {
      io.to(`user_${lecturerId}`).emit("private_message", savedMessage);
    }
    
    res.json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate lecturer sending message (for testing)
app.post("/api/test/send-lecturer-message", async (req, res) => {
  try {
    const { lecturerId, studentId, content } = req.body;
    
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) throw new Error("Lecturer not found");
    
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Student not found");
    
    const message = new Message({
      from: lecturerId,
      fromRole: 'lecturer',
      to: studentId,
      toRole: 'student',
      content
    });
    
    const savedMessage = await message.save();
    
    // If student is connected, send via socket
    const studentSocket = connectedUsers.get(studentId);
    if (studentSocket) {
      io.to(`user_${studentId}`).emit("private_message", savedMessage);
    }
    
    res.json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

















// Get messages between two users
app.get("/api/messages/:userId/:withUserId", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.params.userId, to: req.params.withUserId },
        { from: req.params.withUserId, to: req.params.userId }
      ]
    })
    .sort({ timestamp: 1 })
    .lean();

    res.json({
      status: "success",
      data: messages.map(msg => ({
        id: msg._id,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        timestamp: msg.timestamp,
        fromName: msg.fromName,
        fromRegNumber: msg.fromRegNumber
      }))
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    res.status(500).json({ 
      status: "error",
      message: "Failed to fetch messages",
      error: error.message
    });
  }
});

// Get all messages (admin only)
app.get("/api/messages", async (req, res) => {
  try {
    // Add proper admin authentication in production
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      status: "success",
      data: messages.map(msg => ({
        id: msg._id,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        timestamp: msg.timestamp,
        fromName: msg.fromName,
        fromRegNumber: msg.fromRegNumber,
        fromRole: msg.fromRole
      }))
    });
  } catch (error) {
    console.error("All messages fetch error:", error);
    res.status(500).json({ 
      status: "error",
      message: "Failed to fetch all messages",
      error: error.message
    });
  }
});

// Get connected users (admin only)
app.get("/api/connected-users", (req, res) => {
  try {
    // Add proper admin authentication in production
    const users = Array.from(connectedUsers.values()).map(user => ({
      id: user.id,
      role: user.role,
      name: user.name,
      regNumber: user.regNumber,
      department: user.department,
      socketId: user.socketId,
      lastActive: new Date()
    }));

    res.json({
      status: "success",
      data: users
    });
  } catch (error) {
    console.error("Connected users fetch error:", error);
    res.status(500).json({ 
      status: "error",
      message: "Failed to fetch connected users",
      error: error.message
    });
  }
});
