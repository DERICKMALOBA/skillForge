import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaBook,
  FaVideo,
  FaTasks,
  FaCalendarAlt ,
  FaComments,
  FaSignOutAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Overview from "./Overview";
import ScheduleLectures from "./Shedule"; 
import UploadMaterials from "./materialUpload";
import GiveAssignments from "./Assignment";
import Chat from "./LecturerChat";
import { logoutUser } from "../redux/userSlice";
import { useDispatch } from "react-redux";

import { toast } from "react-toastify";

export default function LecturerDashboard() {
  const user = useSelector((state) => state.user.user);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  const [error, setError]= useState(false)
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.groupCollapsed('[FRONTEND] User Data Verification');
        console.log('Full user object:', JSON.stringify(user, null, 2));
        
        if (!user) {
          console.error('User object is null/undefined');
          throw new Error('User session not loaded. Please wait...');
        }

        // Use _id instead of id
        if (!user._id) {
          console.error('User ID missing in:', user);
          throw new Error('Your session is incomplete. Please log in again.');
        }

        if (user.role !== 'lecturer') {
          console.warn(`User with role '${user.role}' trying to access lecturer endpoint`);
          throw new Error('This feature is only available for lecturers');
        }
        console.groupEnd();

        const lecturerId = String(user._id).trim();  // Fix here for _id
        console.log('[FRONTEND] Sending request with lecturer ID:', lecturerId);

        const response = await fetch("/api/lecturer/my-courses", {
          headers: {
            'lecturer-id': lecturerId,  // Ensure correct header
            'Content-Type': 'application/json',
            'X-User-Role': user.role
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[FRONTEND] API Error:', {
            status: response.status,
            error: errorData
          });
          throw new Error(errorData.message || 'Course fetch failed');
        }

        const coursesData = await response.json();
        setCourses(coursesData);
        console.log('[FRONTEND] Successfully fetched courses:', {
          lecturerId: user._id,
          courseCount: coursesData.length
        });

      } catch (error) {
        console.error('[FRONTEND] Operation Failed:', {
          error: error.message,
          user: user ? {id: user._id, role: user.role} : 'null'
        });
        setError(error.message);
        setCourses([]);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'lecturer') {
      console.log('[FRONTEND] Initiating lecturer data fetch for:', user._id);  // Use _id here
      fetchData();
    } else {
      console.log('[FRONTEND] Access Denied - User:', 
        user ? `Role: ${user.role}` : 'Not logged in');
      setLoading(false);
    }
  }, [user]); // Dependency array listens for changes in the `user` object
  

  const sections = {
    dashboard: "Dashboard Overview",
    schedule: "Schedule Lectures",
    liveLecture: "Start Live Lecture",
    resources: "Upload  Materials",
    assignments: "Give Assignments",
    chat: "Student Chats",
  };

  const handleStartLiveLecture = () => {
    navigate("/live");
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const renderActiveSection = () => {
    if (loading) return <div>Loading courses...</div>;

    switch (activeSection) {
      case "dashboard":
        return (
          <Overview
            user={user}
            courses={courses}
            onUploadClick={handleUploadClick}
          />
        );
      case "liveLecture":
        return (
          <motion.div
            className="p-6 bg-white rounded-lg shadow-lg flex flex-col items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-600 mb-4">
              Start a live lecture session with your students.
            </p>
            <motion.button
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
              onClick={handleStartLiveLecture}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Live Lecture
            </motion.button>
          </motion.div>
        );
// Add this case to the switch statement in renderActiveSection
case "schedule":
  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-lg"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {courses.length > 0 ? (
        <ScheduleLectures  courses={courses} user={user} />
      ) : (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
          No courses available. Please contact administration to be
          assigned to courses.
        </div>
      )}
    </motion.div>
  );
      case "assignments":
        return (
          <motion.div
            className="p-6 bg-white rounded-lg shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {courses.length > 0 ? (
              <GiveAssignments courses={courses} />
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                No courses available. Please contact administration to be
                assigned to courses.
              </div>
            )}
          </motion.div>
        );
      case "chat":
        return (
          <motion.div
            className="p-6 bg-white rounded-lg shadow-lg flex flex-col"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ height: "calc(100vh - 200px)" }} // Adjust height as needed
          >
            <Chat courses={courses} />
          </motion.div>
        );
      case "resources":
        return (
          <motion.div
            className="p-6 bg-white rounded-lg shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {courses.length > 0 ? (
              <UploadMaterials
                courses={courses}
                onClose={handleCloseUploadModal}
              />
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                No courses available. Please contact administration to be
                assigned to courses.
              </div>
            )}
          </motion.div>
        );
      default:
        return (
          <motion.div
            className="p-6 bg-white rounded-lg shadow-lg flex items-center justify-center h-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-gray-600 text-center">
              Content for {sections[activeSection]} will be displayed here.
            </h1>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.aside
        className="w-64 bg-blue-900 text-white p-6 shadow-lg flex flex-col"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <h1 className="text-xl font-bold mb-6">Welcome, {user?.name}!</h1>

        <nav className="space-y-3 flex-1">
          {Object.keys(sections).map((key) => (
            <motion.button
              key={key}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg font-medium text-left transition-all duration-300 
                ${
                  activeSection === key
                    ? "bg-blue-700 text-white shadow-md scale-105"
                    : "text-gray-300 hover:bg-blue-700/20 hover:text-white"
                }`}
              onClick={() => {
                setActiveSection(key);
                if (key === "resources") {
                  setShowUploadModal(false);
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{getIcon(key)}</span>
              <span className="whitespace-nowrap">{sections[key]}</span>
            </motion.button>
          ))}
        </nav>
        <motion.button
          className="flex items-center space-x-3 w-full p-3 mt-8 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="flex justify-between items-center bg-blue-900 text-white p-6 shadow-md">
          <h1 className="text-lg font-bold">Lecturer Dashboard</h1>
          <div className="flex items-center space-x-4">
            <p className="text-sm font-semibold">{currentTime}</p>
            <div className="flex items-center space-x-2">
              <img
                src={user?.photo}
                alt="Lecturer"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-bold">
                  {user?.title}
                  {user?.name}
                </p>
                <p className="text-xs text-gray-300">{user?.department}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Section */}
        <main className="flex-1 p-8 overflow-auto">
          <motion.h1
            className="text-2xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {sections[activeSection]}
          </motion.h1>

          {renderActiveSection()}

          {/* Upload Modal - shown when triggered from Overview */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <UploadMaterials
                  courses={courses}
                  onClose={handleCloseUploadModal}
                />
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function getIcon(section) {
  const icons = {
    dashboard: <FaChalkboardTeacher />,
    liveLecture: <FaVideo />,
    schedule: <FaCalendarAlt />,  
    resources: <FaBook />,
    assignments: <FaTasks />,
    chat: <FaComments />,
  };
  return icons[section] || <FaChalkboardTeacher />;
}
