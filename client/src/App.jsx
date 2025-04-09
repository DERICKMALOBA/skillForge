// src/App.jsx
window.global = window;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StudentDashboard from "./Dashboards/Studentdashboard";
import HODDashboard from "./Dashboards/HodDashboard";
import Register from "./pages/Register";
import { ToastContainer } from "react-toastify";
import LecturerOverview from "./Lecturer/Overview";
import LecturerDashboard from "./Lecturer/LecturerDashboard";
import LiveLecture from "./LiveLecture/Livelecture";
import UploadMaterials from "./Lecturer/materialUpload";
import Unauthorized from "./pages/Unauthoried";
import Login from "./pages/Login";

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/live" element={<LiveLecture />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Student Route */}
        <Route
          path="/student-dashboard"
          element={
            
              <StudentDashboard />
            
          }
        />

        {/* Lecturer Routes */}
        <Route
          path="/lecturer-dashboard"
          element={
            
              <LecturerDashboard />
            
          }
        />
        <Route
          path="/lecturer-overview"
          element={
            
              <LecturerOverview />
            
          }
        />
        <Route
          path="/material"
          element={
            
              <UploadMaterials />
            
          }
        />

        {/* HOD Route */}
        <Route
          path="/hod-dashboard"
          element={
            
              <HODDashboard />
            
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
