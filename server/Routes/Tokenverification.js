const jwt = require("jsonwebtoken");
const Student = require("../Models/Student");
const Lecturer = require("../Models/LecturerModel");
const Hod = require("../Models/HodModel");

const verifyToken = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const [prefix, actualToken] = token.includes("_")
        ? token.split("_")
        : [null, token];

      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

      if (prefix && prefix !== decoded.role) {
        return res.status(401).json({ message: "Invalid token format" });
      }

      let user;
      switch (decoded.role) {
        case "student":
          user = await Student.findById(decoded.id);
          break;
        case "lecturer":
          user = await Lecturer.findById(decoded.id);
          break;
        case "HOD":
          user = await Hod.findById(decoded.id);
          break;
        default:
          return res.status(401).json({ message: "Invalid role" });
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Unauthorized role" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = verifyToken;
