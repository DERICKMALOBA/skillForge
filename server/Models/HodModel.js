const mongoose = require('mongoose');
const hodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    title: { type: String, enum: ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."], required: true },
    employeeNumber: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    department: { type: String, required: true },
    role: { type: String, default: "HOD", enum: ["HOD"] }
  },
  { timestamps: true }
);


const Hod = mongoose.model('Hod', hodSchema);

module.exports =  Hod;