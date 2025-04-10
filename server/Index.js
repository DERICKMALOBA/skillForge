require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

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
app.use("/api/schedule", scheduleRouter);


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
io.use(async (socket, next) => {
  try {
    const { userId, role, registrationNumber } = socket.handshake.auth;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing user ID");
    }

    if (!['student', 'lecturer', 'HOD'].includes(role)) {
      throw new Error("Invalid user role specified");
    }

    let user;
    switch (role) {
      case 'student':
        user = await Student.findById(userId);
        if (!user) throw new Error("Student not found");
        if (registrationNumber && user.registrationNumber !== registrationNumber) {
          throw new Error("Registration number mismatch");
        }
        break;
      case 'lecturer':
        user = await Lecturer.findById(userId);
        if (!user) throw new Error("Lecturer not found");
        break;
      case 'HOD':
        user = await Hod.findById(userId);
        if (!user) throw new Error("HOD not found");
        break;
    }

    socket.userData = {
      id: user._id,
      role,
      name: user.name,
      ...(role === 'student' && { registrationNumber: user.registrationNumber }),
      socketId: socket.id
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
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

  // Disconnection Handler
  socket.on("disconnect", (reason) => {
    clearInterval(heartbeatInterval);
    connectionManager.removeConnection(socket.id);
    console.log(`User disconnected: ${socket.id} (${socket.userData.role}:${socket.userData.id}) - Reason: ${reason}`);
  });

  // Error Handler
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
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
app.get("/api/connections/status", (req, res) => {
  try {
    const now = new Date();
    const connections = connectionManager.getActiveConnections().map(conn => ({
      id: conn.id,
      role: conn.role,
      name: conn.name,
      socketId: conn.socket.id,
      connectedAt: conn.connectedAt,
      lastActive: conn.lastActive,
      inactiveSeconds: Math.round((now - conn.lastActive) / 1000),
      heartbeatCount: conn.heartbeatCount
    }));

    res.json({
      status: "success",
      data: {
        totalConnections: connections.length,
        connections
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to get connection status"
    });
  }
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});