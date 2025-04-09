import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaBook, FaVideo, FaUpload, FaTasks, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UploadMaterials from "./materialUpload"; // Make sure to import this component

export default function Overview({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false); // Added missing state

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
  }, [user]);

  const handleStartLiveLecture = () => {
    navigate("/live");
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Row: Quick Stats */}
      <StatCard 
        icon={<FaBook />} 
        title="My Courses" 
        value={`${courses.length} Assigned`} 
      />
      <StatCard icon={<FaVideo />} title="Live Lectures Today" value="2 Scheduled" />
      <StatCard icon={<FaUpload />} title="Uploaded Resources" value="15 Materials" />

      {/* Second Row: Assignments, Messages & Lectures */}
      <StatCard icon={<FaTasks />} title="Pending Assignments" value="3 to Grade" />
      <StatCard icon={<FaComments />} title="Student Messages" value="5 Unread" />
      <motion.div className="p-6 bg-white rounded-lg shadow-lg col-span-1 sm:col-span-2 lg:col-span-1">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Upcoming Lectures</h2>
        <ul className="text-gray-600">
          {courses.slice(0, 2).map(course => (
            <li key={course._id}>
              📖 {course.courseName} – {course.schedule}
              <a href="#" className="text-blue-600 ml-2">[Join]</a>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Announcements Section */}
      <motion.div className="p-6 bg-white rounded-lg shadow-lg col-span-1 sm:col-span-2 lg:col-span-2">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Announcements from HOD</h2>
        {announcements.length > 0 ? (
          announcements.slice(0, 3).map(announcement => (
            <div key={announcement._id} className="mb-3">
              <p className="text-gray-600">
                <strong>{new Date(announcement.createdAt).toLocaleDateString()}:</strong> 
                {announcement.message}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No announcements</p>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionButton 
            title="Start Lecture" 
            icon={<FaVideo />} 
            onClick={handleStartLiveLecture} 
          />
          <ActionButton 
            title="Upload Materials" 
            icon={<FaUpload />} 
            onClick={handleUploadClick}
          />
        </div>
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <UploadMaterials 
              courses={courses} 
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* Stats Card Component */
function StatCard({ icon, title, value }) {
  return (
    <motion.div className="p-6 bg-white rounded-lg shadow-lg flex items-center space-x-4">
      <div className="text-blue-600 text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-gray-600">{value}</p>
      </div>
    </motion.div>
  );
}

/* Quick Actions Button */
function ActionButton({ title, icon, onClick }) {
  return (
    <motion.button
      className="p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 w-full"
      onClick={onClick}
    >
      {icon}
      <span>{title}</span>
    </motion.button>
  );
}