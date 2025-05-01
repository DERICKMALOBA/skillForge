import { useState } from "react";
import { FaUserGraduate, FaBook, FaVideo, FaTasks, FaComments, FaCog, FaSignOutAlt } from "react-icons/fa";
import DashboardOverview from "../Student/Dashboard";
import OnlineClasses from "../Student/OnlineClass";
import StudyMaterials from "../Student/StudyMaterial";
import Assignments from "../Student/Assignments";

import StudentChat from "../Student/StudentChat";
import { logoutUser } from "../redux/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sections = {
    dashboard: "Dashboard Overview",
    lectures: "Online Classes",
    resources: "Study Materials",
    assignments: "Assignments",
    chat: "Chat",
    
  };
  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    navigate("/login");
  };
  // Render the correct component based on activeSection
  function renderSection() {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "lectures":
        return <OnlineClasses />;
      case "resources":
        return <StudyMaterials />;
      case "assignments":
        return <Assignments />;
      case "chat":
        return <StudentChat />;
     
      default:
        return <DashboardOverview />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-blue-900 text-white p-5">
        <h2 className="text-xl font-bold mb-5">Student Dashboard</h2>
        <nav className="space-y-6">
          {Object.keys(sections).map((key) => (
            <button
              key={key}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-blue-700 transition ${
                activeSection === key ? "bg-blue-700" : ""
              }`}
              onClick={() => setActiveSection(key)}
            >
              {getIcon(key)}
              <span>{sections[key]}</span>
            </button>
          ))}
          <button  onClick={handleLogout} className="flex items-center space-x-3 w-full p-3 mt-5 bg-red-600 rounded-lg hover:bg-red-700 transition">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">{sections[activeSection]}</h1>
        {renderSection()}
      </main>
    </div>
  );
}

function getIcon(section) {
  const icons = {
    dashboard: <FaUserGraduate />, 
    lectures: <FaVideo />, 
    resources: <FaBook />, 
    assignments: <FaTasks />, 
    chat: <FaComments />, 
    settings: <FaCog />, 
  };
  return icons[section] || <FaUserGraduate />;
}
