import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FaUsers, FaChalkboardTeacher, FaBook, FaChartBar, FaCog, FaSignOutAlt } from "react-icons/fa";

const HODDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections = {
    dashboard: "Dashboard Overview",
    students: "Student Management",
    lecturers: "Lecturer Management",
    courses: "Courses & Units",
    reports: "Reports & Analytics",
    settings: "Profile & Account Settings",
  };

  const data = [
    { name: "Jan", students: 400, courses: 30 },
    { name: "Feb", students: 300, courses: 25 },
    { name: "Mar", students: 500, courses: 35 },
    { name: "Apr", students: 450, courses: 28 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-blue-900 text-white p-5">
        <h2 className="text-xl font-bold mb-5">HOD Dashboard</h2>
        <nav className="space-y-3">
          {Object.keys(sections).map((key) => (
            <motion.button
              key={key}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-blue-700 transition ${
                activeSection === key ? "bg-blue-700" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveSection(key)}
            >
              {getIcon(key)}
              <span>{sections[key]}</span>
            </motion.button>
          ))}
          <button className="flex items-center space-x-3 w-full p-3 mt-5 bg-red-600 rounded-lg hover:bg-red-700 transition">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">{sections[activeSection]}</h1>
        <motion.div 
          className="p-6 bg-white rounded-lg shadow-md" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-600">Content for {sections[activeSection]} will be displayed here.</p>
        </motion.div>

        {/* Chart Section */}
        <motion.div className="mt-6 p-6 bg-white rounded-lg shadow-md" whileHover={{ scale: 1.02 }}>
          <h3 className="text-lg font-semibold mb-4">Student & Course Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#4A90E2" name="Students" />
              <Bar dataKey="courses" fill="#FF5733" name="Courses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </main>
    </div>
  );
};

const getIcon = (section) => {
  const icons = {
    dashboard: <FaChartBar />, 
    students: <FaUsers />, 
    lecturers: <FaChalkboardTeacher />, 
    courses: <FaBook />, 
    reports: <FaChartBar />, 
    settings: <FaCog />, 
  };
  return icons[section] || <FaChartBar />;
};

export default HODDashboard;













import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FaUsers, FaChalkboardTeacher, FaBook, FaChartBar, FaCog, FaSignOutAlt, FaFileAlt } from "react-icons/fa";

const HODDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections = {
    dashboard: "Dashboard Overview",
    students: "Student Management",
    lecturers: "Lecturer Management",
    courses: "Courses & Units",
    reports: "Reports & Analytics",
    settings: "Profile & Account Settings",
  };

  const data = [
    { name: "Jan", students: 400, courses: 30 },
    { name: "Feb", students: 300, courses: 25 },
    { name: "Mar", students: 500, courses: 35 },
    { name: "Apr", students: 450, courses: 28 },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-blue-900 text-white p-5">
        <h2 className="text-xl font-bold mb-5">HOD Dashboard</h2>
        <nav className="space-y-3">
          {Object.keys(sections).map((key) => (
            <motion.button
              key={key}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-blue-700 transition ${
                activeSection === key ? "bg-blue-700" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveSection(key)}
            >
              {getIcon(key)}
              <span>{sections[key]}</span>
            </motion.button>
          ))}
          <button className="flex items-center space-x-3 w-full p-3 mt-5 bg-red-600 rounded-lg hover:bg-red-700 transition">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">{sections[activeSection]}</h1>
        <motion.div 
          className="p-6 bg-white rounded-lg shadow-md" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          {activeSection === "reports" ? (
            <ReportsSection />
          ) : (
            <p className="text-gray-600">Content for {sections[activeSection]} will be displayed here.</p>
          )}
        </motion.div>
      </main>
    </div>
  );
};

const ReportsSection = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Key Reports</h3>
      <ul className="list-disc pl-5 text-gray-700">
        <li>Student Performance Reports (Grades, attendance, dropout rates)</li>
        <li>Lecturer Performance Reports (Feedback, grading efficiency)</li>
        <li>Course Management Reports (Enrollment trends, completion rates)</li>
        <li>Departmental Analytics (Graduation rates, resource utilization)</li>
        <li>Complaints & Feedback Reports</li>
      </ul>
    </div>
  );
};

const getIcon = (section) => {
  const icons = {
    dashboard: <FaChartBar />, 
    students: <FaUsers />, 
    lecturers: <FaChalkboardTeacher />, 
    courses: <FaBook />, 
    reports: <FaFileAlt />, 
    settings: <FaCog />, 
  };
  return icons[section] || <FaChartBar />;
};

export default HODDashboard;