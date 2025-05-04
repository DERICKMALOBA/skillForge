import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaBook, FaVideo, FaUpload, FaTasks, FaComments, FaBullhorn, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UploadMaterials from "./materialUpload";

export default function Overview({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (!user?._id || user?.role !== "lecturer") {
          setLoading(false);
          return;
        }

        const lecturerId = String(user._id).trim();

        // Fetch courses
        const coursesResponse = await fetch("/api/lecturer/my-courses", {
          headers: {
            "lecturer-id": lecturerId,
            "Content-Type": "application/json",
            "X-User-Role": user.role,
          },
          credentials: "include",
        });
        
        if (!coursesResponse.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch schedules
        const schedulesResponse = await fetch(`/api/schedule/schedules/${lecturerId}`);
        if (!schedulesResponse.ok) throw new Error("Failed to fetch schedules");
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);

        // Fetch announcements
        const announcementsResponse = await fetch("/api/hod/announcements");
        if (!announcementsResponse.ok) throw new Error("Failed to fetch announcements");
        const announcementsData = await announcementsResponse.json();
        setAnnouncements(announcementsData.announcements || []);

        // Fetch assignments for each course
        if (coursesData.length > 0) {
          const assignmentPromises = coursesData.map(course => 
            fetch(`/api/assignments/course/${course._id}`)
              .then(res => res.json())
              .then(data => data.data || [])
          );
          
          const allAssignments = await Promise.all(assignmentPromises);
          const flattenedAssignments = allAssignments.flat();
          setAssignments(flattenedAssignments);

          // Calculate pending assignments
          const pendingCount = flattenedAssignments.filter(
            assignment => !assignment.graded
          ).length;
          setPendingAssignmentsCount(pendingCount);
        }

        // Fetch materials
        const materialsResponse = await fetch(`/api/lecturer/materials`, {
          headers: {
            "Content-Type": "application/json",
            "Lecturer-Id": lecturerId,
            "X-User-Role": "lecturer",
          },
        });
        
        if (!materialsResponse.ok) throw new Error("Failed to fetch materials");
        const materialsData = await materialsResponse.json();
        if (materialsData.success) setMaterials(materialsData.materials);

        // Fetch unread messages (placeholder)
        setUnreadMessagesCount(5);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  // Get today's date in YYYY-MM-DD format for comparison
  const today = new Date().toISOString().split('T')[0];
  
  // Filter today's lectures
  const todaysLectures = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
    return scheduleDate === today;
  });

  // Filter upcoming lectures (future dates)
  const upcomingLectures = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate > new Date() && scheduleDate.toISOString().split('T')[0] !== today;
  }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date

  const handleStartLiveLecture = () => {
    navigate("/live");
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
      Error: {error}
    </div>
  );

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Row: Quick Stats */}
      <StatCard
        icon={<FaBook className="text-blue-600" />}
        title="My Courses"
        value={`${courses.length} Assigned`}
      />
      
      {/* Today's Lectures Card - Now shows actual lectures */}
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg"
        whileHover={{ scale: 1.03 }}
      >
        <div className="flex items-center space-x-4">
          <FaVideo className="text-green-600 text-3xl" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Live Lectures Today</h3>
            <p className="text-gray-600">{todaysLectures.length} Scheduled</p>
          </div>
        </div>
        {todaysLectures.length > 0 && (
          <div className="mt-3 space-y-2">
            {todaysLectures.map((lecture, index) => (
              <div key={index} className="text-sm text-gray-600 pl-12">
                <p className="font-medium">
                  {lecture.course?.name || 'No course name'}
                </p>
                <p>
                  {new Date(lecture.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(lecture.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <StatCard
        icon={<FaUpload className="text-purple-600" />}
        title="Uploaded Resources"
        value={`${materials.length} Materials`}
      />

      {/* Pending Assignments Card - Now shows actual assignments */}
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg"
        whileHover={{ scale: 1.03 }}
      >
        <div className="flex items-center space-x-4">
          <FaTasks className="text-orange-600 text-3xl" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Your Assignments</h3>
            <p className="text-gray-600">{assignments.length} Given ({pendingAssignmentsCount} to Grade)</p>
          </div>
        </div>
        {assignments.length > 0 && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {assignments.slice(0, 3).map((assignment) => (
              <div key={assignment._id} className="text-sm text-gray-600 pl-12">
                <p className="font-medium">{assignment.title}</p>
                <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p className={`text-xs ${assignment.graded ? 'text-green-600' : 'text-orange-600'}`}>
                  {assignment.graded ? 'Graded' : 'Pending'}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <StatCard
        icon={<FaComments className="text-red-600" />}
        title="Student Messages"
        value={`${unreadMessagesCount} Unread`}
      />
      
      {/* Upcoming Lectures Section */}
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg col-span-1 sm:col-span-2 lg:col-span-1 min-w-0"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center mb-3">
          <FaCalendarAlt className="text-blue-500 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">Upcoming Lectures</h2>
        </div>
        {upcomingLectures.length > 0 ? (
          <ul className="text-gray-600 space-y-3">
            {upcomingLectures.slice(0, 3).map((lecture) => (
              <li key={lecture._id} className="flex flex-col">
                <div className="flex items-start">
                  <span className="mr-2 flex-shrink-0">📅</span>
                  <div>
                    <p className="font-medium">
                      {lecture.course?.name || 'No course name'}
                    </p>
                    <p className="text-sm">
                      {new Date(lecture.date).toLocaleDateString()} • 
                      {new Date(lecture.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(lecture.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No upcoming lectures scheduled</p>
        )}
      </motion.div>

      {/* Rest of the component remains the same */}
      {/* Announcements Section */}
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg col-span-1 sm:col-span-2 lg:col-span-2"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center mb-3">
          <FaBullhorn className="text-yellow-500 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">Announcements</h2>
        </div>
        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.slice(0, 4).map((announcement) => (
              <div 
                key={announcement._id} 
                className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-800">
                    {announcement.title || "Announcement"}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {announcement.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            No announcements available
          </div>
        )}
      </motion.div>


      {/* Quick Actions */}
      <motion.div 
        className="p-6 bg-white rounded-lg shadow-lg"
        whileHover={{ scale: 1.01 }}
      >
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

// StatCard and ActionButton components remain the same
function StatCard({ icon, title, value }) {
  return (
    <motion.div 
      className="p-6 bg-white rounded-lg shadow-lg flex items-center space-x-4"
      whileHover={{ scale: 1.03 }}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-gray-600">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionButton({ title, icon, onClick }) {
  return (
    <motion.button
      className="p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 w-full"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <span className="text-lg">{icon}</span>
      <span>{title}</span>
    </motion.button>
  );
}