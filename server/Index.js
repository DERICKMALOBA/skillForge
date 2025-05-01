require("dotenv").config();
const cookieParser = require('cookie-parser');
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const Course = require("./Models/CourseModel");
// Models and Routes
const authRoutes = require("./Routes/AuthRoute");
const HodRouter = require("./Routes/hod");
const LecturerRouter = require("./Routes/LecturerRoute");
const AssignmentRouter = require("./Routes/Assignment");
const Message = require("./Models/messagemodel");
const Student = require("./Models/Student");
const Lecturer = require("./Models/LecturerModel");
const Hod = require("./Models/HodModel");
const scheduleRouter = require("./Routes/Shedule");
const StudentRoute = require("./Routes/StudentRoute");
const authenticate = require("./Routes/AuthMiddlewere");
const NotifyRouter = require("./Routes/materialUplaodnotify");
const AssignmentNotify = require("./Routes/AssignmentNotify");

const app = express();
const server = http.createServer(app);

// Initialize active lectures map
const activeLectures = new Map();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hod", HodRouter);
app.use("/api/lecturer", LecturerRouter);
app.use("/api/assignments", AssignmentRouter);
app.use("/api/assignments", AssignmentNotify);
app.use("/api/schedule", scheduleRouter);
app.use("/api/notify", NotifyRouter);
app.use("/api/student", StudentRoute);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Connection Manager
class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.userConnections = new Map();
    this.maxConnectionsPerUser = 3;
  }

  addConnection(socket) {
    const userId = socket.userData.id.toString();
    const userConnections = this.getUserConnections(userId);

    if (userConnections.length >= this.maxConnectionsPerUser) {
      const oldestConnection = userConnections[0];
      oldestConnection.socket.disconnect(true);
      console.log(`Closed oldest connection for ${userId} (${oldestConnection.socket.id})`);
    }

    const connectionData = {
      ...socket.userData,
      socket,
      connectedAt: new Date(),
      lastActive: new Date(),
      heartbeatCount: 0
    };

    this.connections.set(socket.id, connectionData);
    this.updateUserConnections(userId, socket.id, connectionData);

    console.log(`Added connection for ${userId} (${socket.id}), total: ${userConnections.length + 1}`);
    return true;
  }

  removeConnection(socketId) {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    const userId = connection.id;
    this.connections.delete(socketId);

    const userConnections = this.userConnections.get(userId) || [];
    const updatedConnections = userConnections.filter(conn => conn.socketId !== socketId);

    if (updatedConnections.length > 0) {
      this.userConnections.set(userId, updatedConnections);
    } else {
      this.userConnections.delete(userId);
    }

    console.log(`Removed connection ${socketId} for ${userId}, remaining: ${updatedConnections.length}`);
  }

  getUserConnections(userId) {
    return this.userConnections.get(userId.toString()) || [];
  }

  updateUserConnections(userId, socketId, connectionData) {
    const userConnections = this.getUserConnections(userId);
    userConnections.push({ socketId, ...connectionData });
    this.userConnections.set(userId.toString(), userConnections);
  }

  updateLastActive(socketId) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActive = new Date();
      connection.heartbeatCount++;
    }
  }

  getActiveConnections() {
    return Array.from(this.connections.values());
  }
}

const connectionManager = new ConnectionManager();

// Socket.IO Setup with Enhanced Stability
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false
  },
  pingTimeout: 20000, // 20 seconds
  pingInterval: 10000, // 10 seconds
  transports: ['websocket'],
  allowUpgrades: false,
});

// Socket Authentication Middleware
// Updated Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    // Get token from either handshake auth or cookies
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.cookie?.split('accessToken=')[1]?.split(';')[0];
    
    if (!token) {
      console.error('No authentication token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check user in appropriate model based on role
    let user;
    switch (decoded.role) {
      case 'student':
        user = await Student.findById(decoded.id);
        if (!user) throw new Error("Student not found");
        break;
      case 'lecturer':
        user = await Lecturer.findById(decoded.id);
        if (!user) throw new Error("Lecturer not found");
        break;
      case 'HOD':
        user = await Hod.findById(decoded.id);
        if (!user) throw new Error("HOD not found");
        break;
      default:
        throw new Error("Invalid user role");
    }

    // Attach user data to socket
    socket.userData = {
      id: user._id,
      role: decoded.role,
      name: user.name,
      ...(decoded.role === 'student' && { 
        registrationNumber: user.registrationNumber 
      })
    };

    console.log(`Authenticated ${decoded.role}: ${user.name}`);
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error(`Authentication failed: ${error.message}`));
  }
});

// Socket Connection Handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} (${socket.userData.role}:${socket.userData.id})`);

  // Add to connection manager
  connectionManager.addConnection(socket);

  // Setup heartbeat
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat');
    }
  }, 10000);

  // Handle heartbeats
  socket.on('heartbeat_ack', () => {
    connectionManager.updateLastActive(socket.id);
  });

  // Message Handlers
  setupMessageHandlers(socket);

  // Lecture Room Handlers
  socket.on("create-lecture", ({ courseId }) => {
    const lectureId = uuidv4();
    const lecturerId = socket.userData.id;
    
    const lecture = {
      id: lectureId,
      courseId,
      lecturerId,
      lecturerName: socket.userData.name, // Add lecturer name
      courseName: "Course Name",         // You'll need to fetch this from your DB
      participants: new Map(),
      createdAt: new Date(),
      isActive: true
    };
    
    activeLectures.set(lectureId, lecture);
    socket.join(lectureId);
    
    // Broadcast to all clients
    io.emit("lecture-created", {
      ...lecture,
      participantCount: 0
    });
    
    console.log(`Lecture ${lectureId} created by ${lecturerId}`);
  });

  socket.on("join-lecture", ({ lectureId }) => {
    const lecture = activeLectures.get(lectureId);
    if (!lecture) {
      return socket.emit("error", { message: "Lecture not found" });
    }

    const user = {
      id: socket.userData.id,
      name: socket.userData.name,
      role: socket.userData.role,
      socketId: socket.id,
      joinedAt: new Date(),
      isPresenting: false
    };

    lecture.participants.set(socket.userData.id, user);
    socket.join(lectureId);
    
    // Notify all participants about new attendance count
    io.to(lectureId).emit("attendance-update", {
      count: lecture.participants.size,
      participants: Array.from(lecture.participants.values())
    });

    console.log(`${user.name} joined lecture ${lectureId}`);
  });

  socket.on("request-presentation", ({ lectureId }) => {
    const lecture = activeLectures.get(lectureId);
    if (!lecture) return;

    // Only lecturer can approve presentation requests
    io.to(lecture.lecturerId).emit("presentation-request", {
      studentId: socket.userData.id,
      studentName: socket.userData.name
    });
  });

  socket.on("approve-presentation", ({ lectureId, studentId }) => {
    const lecture = activeLectures.get(lectureId);
    if (!lecture || socket.userData.id !== lecture.lecturerId) return;

    const student = lecture.participants.get(studentId);
    if (student) {
      student.isPresenting = true;
      io.to(student.socketId).emit("presentation-approved");
      io.to(lectureId).emit("presentation-started", {
        presenterId: studentId,
        presenterName: student.name
      });
    }
  });

  socket.on("stop-presentation", ({ lectureId }) => {
    const lecture = activeLectures.get(lectureId);
    if (!lecture) return;

    // Lecturer can stop any presentation
    if (socket.userData.id === lecture.lecturerId) {
      for (const [id, participant] of lecture.participants) {
        if (participant.isPresenting) {
          participant.isPresenting = false;
          io.to(participant.socketId).emit("presentation-stopped");
          break;
        }
      }
    } 
    // Presenter can stop their own presentation
    else if (lecture.participants.get(socket.userData.id)) {
      const presenter = lecture.participants.get(socket.userData.id);
      if (presenter.isPresenting) {
        presenter.isPresenting = false;
        io.to(lectureId).emit("presentation-stopped");
      }
    }
  });

  // Error Handler
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  // Disconnection Handler
  socket.on("disconnect", (reason) => {
    clearInterval(heartbeatInterval);
    connectionManager.removeConnection(socket.id);
    
    // Clean up lecture participation on disconnect
    for (const [lectureId, lecture] of activeLectures) {
      if (lecture.participants.has(socket.userData.id)) {
        lecture.participants.delete(socket.userData.id);
        io.to(lectureId).emit("attendance-update", {
          count: lecture.participants.size,
          participants: Array.from(lecture.participants.values())
        });
      }
    }
    
    console.log(`User disconnected: ${socket.id} (${socket.userData.role}:${socket.userData.id}) - Reason: ${reason}`);
  });
});

function setupMessageHandlers(socket) {
  // Private Message Handler
  socket.on("private_message", async ({ to, content }, callback) => {
    try {
      if (!to || !content) {
        throw new Error("Recipient and content are required");
      }

      const recipientId = to.toString();
      const senderId = socket.userData.id.toString();

      if (recipientId === senderId) {
        throw new Error("Cannot send message to yourself");
      }

      const recipient = await getUserById(recipientId);
      if (!recipient) {
        throw new Error("Recipient not found");
      }

      const newMessage = new Message({
        from: senderId,
        to: recipientId,
        content,
        fromName: socket.userData.name,
        fromRegNumber: socket.userData.registrationNumber,
        fromRole: socket.userData.role,
        toRole: recipient.role,
        timestamp: new Date(),
        delivered: false
      });

      await newMessage.save();

      // Deliver to recipient if online
      const recipientConnections = connectionManager.getUserConnections(recipientId);
      recipientConnections.forEach(conn => {
        io.to(conn.socketId).emit("private_message", {
          _id: newMessage._id,
          from: senderId,
          to: recipientId,
          content,
          timestamp: newMessage.timestamp,
          fromName: socket.userData.name,
          fromRegNumber: socket.userData.registrationNumber,
          delivered: false
        });
      });

      callback({
        status: "success",
        message: "Message sent successfully",
        messageId: newMessage._id
      });
    } catch (error) {
      console.error("Message send error:", error);
      callback({
        status: "error",
        message: error.message || "Failed to send message"
      });
    }
  });

  // Chat History Handler
  socket.on("get_chat_history", async ({ withUserId }, callback) => {
    try {
      if (!withUserId) {
        throw new Error("withUserId parameter is required");
      }

      const currentUserId = socket.userData.id.toString();
      const otherUserId = withUserId.toString();

      if (!(await checkUserExists(otherUserId))) {
        throw new Error("Requested user not found");
      }

      const messages = await Message.find({
        $or: [
          { from: currentUserId, to: otherUserId },
          { from: otherUserId, to: currentUserId }
        ]
      })
      .sort({ timestamp: 1 })
      .lean();

      callback({
        status: "success",
        messages: messages.map(msg => ({
          _id: msg._id,
          from: msg.from,
          to: msg.to,
          content: msg.content,
          timestamp: msg.timestamp,
          fromName: msg.fromName,
          fromRegNumber: msg.fromRegNumber,
          delivered: msg.delivered
        }))
      });
    } catch (error) {
      console.error("Chat history error:", error);
      callback({
        status: "error",
        message: error.message || "Failed to load chat history"
      });
    }
  });

  // Mark Messages as Delivered
  socket.on("mark_as_delivered", async (messageIds, callback) => {
    try {
      if (!Array.isArray(messageIds)) {
        throw new Error("messageIds must be an array");
      }

      const result = await Message.updateMany(
        { 
          _id: { $in: messageIds }, 
          to: socket.userData.id.toString(),
          delivered: false 
        },
        { $set: { delivered: true } }
      );

      callback({
        status: "success",
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error("Mark as delivered error:", error);
      callback({
        status: "error",
        message: error.message || "Failed to mark messages as delivered"
      });
    }
  });
}

// Helper Functions
async function checkUserExists(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;
  return (
    (await Student.exists({ _id: userId })) ||
    (await Lecturer.exists({ _id: userId })) ||
    (await Hod.exists({ _id: userId }))
  );
}

async function getUserById(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  
  const student = await Student.findById(userId);
  if (student) return { ...student.toObject(), role: 'student' };
  
  const lecturer = await Lecturer.findById(userId);
  if (lecturer) return { ...lecturer.toObject(), role: 'lecturer' };
  
  const hod = await Hod.findById(userId);
  if (hod) return { ...hod.toObject(), role: 'HOD' };
  
  return null;
}

// REST API Endpoints



// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});






// API endpoint for active lectures
// GET: List all active lectures
app.get('/api/lectures/active', (req, res) => {
  try {
    const lectures = Array.from(activeLectures.values()).map(lecture => ({
      id: lecture.id,
      courseId: lecture.courseId,
      courseName: lecture.courseName,
      lecturerId: lecture.lecturerId,
      lecturerName: lecture.lecturerName,
      participantCount: lecture.participants.size,
      createdAt: lecture.createdAt
    }));
    
    res.json({
      success: true,
      lectures: lectures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active lectures'
    });
  }
});


// Add this with your other routes
app.post('/api/lectures/start', async (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;
    
    // Validate input
    if (!courseId || !lecturerId) {
      return res.status(400).json({ 
        success: false,
        error: 'Both courseId and lecturerId are required' 
      });
    }

    // Find course and lecturer
    const course = await Course.findById(courseId).select('name code');
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const lecturer = await Lecturer.findById(lecturerId).select('name email');
    if (!lecturer) {
      return res.status(404).json({ 
        success: false,
        error: 'Lecturer not found' 
      });
    }

    // Create lecture
    const lectureId = uuidv4();
    const lecture = {
      id: lectureId,
      courseId,
      courseName: course.name,
      courseCode: course.code,
      lecturerId,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      participants: new Map(),
      createdAt: new Date()
    };

    activeLectures.set(lectureId, lecture);
    
    // Broadcast to all clients
    io.emit('lecture-created', {
      ...lecture,
      participantCount: 0
    });

    // Return consistent response structure
    res.json({ 
      success: true,
      lectureId,
      lecture: { // Include the full lecture object
        id: lectureId,
        courseId,
        courseName: course.name,
        courseCode: course.code,
        lecturerId,
        lecturerName: lecturer.name
      },
      message: 'Lecture started successfully'
    });

  } catch (error) {
    console.error('Lecture start error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});




// POST: Student joins lecture (must match frontend expectation)
app.post('/api/lectures/:lectureId/join', async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { studentId, studentName } = req.body;

    // Validate input
    if (!studentId || !studentName) {
      return res.status(400).json({ 
        success: false,
        error: 'Student ID and name are required' 
      });
    }

    // Check lecture exists
    if (!activeLectures.has(lectureId)) {
      return res.status(404).json({ 
        success: false,
        error: 'Lecture not found or has ended' 
      });
    }

    const lecture = activeLectures.get(lectureId);

    // Add student to participants
    lecture.participants.set(studentId, {
      id: studentId,
      name: studentName,
      joinedAt: new Date()
    });

    // Broadcast updated participant count
    io.emit('participant-update', {
      lectureId,
      participantCount: lecture.participants.size
    });

    res.json({ 
      success: true,
      lectureId,
      courseName: lecture.courseName,
      lecturerName: lecture.lecturerName
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error joining lecture' 
    });
  }
});

// GET: Get lecture info (matches frontend expectation)
app.get('/api/lectures/:lectureId/info', (req, res) => {
  try {
    const { lectureId } = req.params;

    if (!activeLectures.has(lectureId)) {
      return res.status(404).json({ 
        success: false,
        error: 'Lecture not found or has ended' 
      });
    }

    const lecture = activeLectures.get(lectureId);
    res.json({
      success: true,
      lecture: {
        id: lecture.id,
        courseName: lecture.courseName,
        lecturerName: lecture.lecturerName,
        participantCount: lecture.participants.size
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching lecture info' 
    });
  }
});