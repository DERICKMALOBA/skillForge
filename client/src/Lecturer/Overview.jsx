import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBook,
  FaVideo,
  FaUpload,
  FaTasks,
  FaComments,
  FaBullhorn,
  FaCalendarAlt,
} from "react-icons/fa";
import UploadMaterials from "./materialUpload";

// Enhanced date formatting functions
const formatDate = (dateString) => {
  const date = parseDate(dateString);
  return date?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) || "Not scheduled";
};

const formatTime = (dateString) => {
  const date = parseDate(dateString);
  return date?.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }) || "--:--";
};

const parseDate = (dateString) => {
  if (!dateString) return null;

  // Try parsing as ISO string first
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;

  // If that fails, try parsing as timestamp
  date = new Date(parseInt(dateString));
  if (!isNaN(date.getTime())) return date;

  return null;
};

export default function Overview({ user }) {
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
        const schedulesResponse = await fetch(
          `/api/schedule/schedules/${lecturerId}`
        );
        if (!schedulesResponse.ok) throw new Error("Failed to fetch schedules");
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);
  
        // Fetch announcements
        const announcementsResponse = await fetch("/api/hod/announcements");
        if (!announcementsResponse.ok)
          throw new Error("Failed to fetch announcements");
        const announcementsData = await announcementsResponse.json();
        setAnnouncements(announcementsData.announcements || []);
  
        // Fetch assignments
        const assignmentsResponse = await fetch(
          `/api/assignments/lecturer/${lecturerId}`,
          {
            method: 'GET',
            headers: {
              "Content-Type": "application/json",
              "X-User-Role": user.role,
              "Lecturer-Id": lecturerId,
            },
            credentials: "include",
          }
        );
  
        if (!assignmentsResponse.ok) {
          throw new Error("Failed to fetch assignments");
        }
        
        const assignmentsData = await assignmentsResponse.json();
        const assignmentsArray = assignmentsData.assignments || assignmentsData.data || [];
        setAssignments(assignmentsArray);
  
        // Calculate pending assignments
        const pendingCount = assignmentsArray.filter(
          (assignment) => !assignment.graded
        ).length;
        setPendingAssignmentsCount(pendingCount);
  
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

  // Current date and time
  const now = new Date();

  // Helper function to compare dates without time
  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Filter today's lectures (where endTime is today)
  const todaysLectures = schedules.filter((schedule) => {
    const startTime = parseDate(schedule.startTime);
    const endTime = parseDate(schedule.endTime);

    if (!startTime || !endTime) return false;

    // Check if it's today
    const isToday = isSameDay(endTime, now);

    const isCurrentOrFuture = now < endTime;

    return isToday && isCurrentOrFuture;
  });

  // Filter upcoming lectures (where endTime is after today)
  const upcomingLectures = schedules
    .filter((schedule) => {
      const endTime = parseDate(schedule.endTime);
      if (!endTime) return false;

      // Create date-only versions for comparison
      const endDate = new Date(endTime);
      endDate.setHours(0, 0, 0, 0);

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      return endDate > today && !isSameDay(endTime, now);
    })
    .sort((a, b) => {
      const endTimeA = parseDate(a.endTime);
      const endTimeB = parseDate(b.endTime);
      return (endTimeA || 0) - (endTimeB || 0);
    });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-center py-8 text-gray-600">
        Loading your dashboard...
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500 text-center py-8 max-w-md mx-auto bg-red-50 p-6 rounded-lg">
        <p className="font-medium">Error loading dashboard</p>
        <p className="mt-2 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg mb-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Lecturer Dashboard</h1>
        <p className="text-blue-100 mt-2">
          Welcome, <span className="font-semibold">{user.title}{user.name}</span>
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Courses Card */}
        <StatCard
          icon={<FaBook className="text-blue-600 text-2xl" />}
          title="My Courses"
          value={`${courses.length} Assigned`}
          color="blue"
        />

        {/* Today's Lectures Card */}
        <StatCard
          icon={<FaVideo className="text-green-600 text-2xl" />}
          title="Today's Lectures"
          value={`${todaysLectures.length} Scheduled`}
          color="green"
        />

        {/* Materials Card */}
        <StatCard
          icon={<FaUpload className="text-purple-600 text-2xl" />}
          title="Uploaded Resources"
          value={`${materials.length} Materials`}
          color="purple"
        />

        {/* Assignments Card */}
        <StatCard
          icon={<FaTasks className="text-orange-600 text-2xl" />}
          title="Assignments"
          value={`${assignments.length} Given`}
          color="orange"
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Lectures Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <FaVideo className="w-4 h-4 mr-2" />
              Today's Lectures
            </h2>
          </div>
          <div className="p-4">
            {todaysLectures.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No lectures scheduled for today
              </div>
            ) : (
              <ul className="space-y-3">
                {todaysLectures.map((lecture) => (
                  <li key={lecture._id} className="border-l-4 border-green-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {lecture.title || "No course name"}
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center text-gray-500">
                            <span className="font-medium mr-1">Time:</span>
                            <span>{formatTime(lecture.startTime)}</span>
                            <span className="mx-1">to</span>
                            <span>{formatTime(lecture.endTime)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                        Today
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Lectures Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <FaCalendarAlt className="w-4 h-4 mr-2" />
              Upcoming Lectures
            </h2>
            <span className="text-sm text-blue-100 ml-auto">
              {upcomingLectures.length} upcoming
            </span>
          </div>
          <div className="p-4">
            {upcomingLectures.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No upcoming lectures scheduled
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingLectures.slice(0, 4).map((lecture) => (
                  <li key={lecture._id} className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {lecture.title || "No course name"}
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center text-gray-500">
                            <span className="font-medium mr-1">Date:</span>
                            <span>{formatDate(lecture.startTime)}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <span className="font-medium mr-1">Time:</span>
                            <span>{formatTime(lecture.startTime)}</span>
                            <span className="mx-1">to</span>
                            <span>{formatTime(lecture.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <FaTasks className="w-4 h-4 mr-2" />
              Recent Assignments
            </h2>
          </div>
          <div className="p-4">
            {assignments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No assignments given yet
              </div>
            ) : (
              <ul className="space-y-3">
                {assignments.slice(0, 4).map((assignment) => (
                  <li key={assignment._id} className="border-l-4 border-orange-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {assignment.title}
                        </h4>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      {/* <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.graded 
                          ? "bg-green-100 text-green-800" 
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {assignment.graded ? "Graded" : "Pending"}
                      </span> */}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <FaBullhorn className="w-4 h-4 mr-2" />
              Latest Announcements
            </h2>
          </div>
          <div className="p-4">
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No announcements available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.slice(0, 4).map((announcement) => (
                  <div key={announcement._id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500 hover:bg-white transition">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-800">
                        {announcement.title || "Announcement"}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(announcement.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">
                      {announcement.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}

function StatCard({ icon, title, value, color = "blue" }) {
  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
  };

  return (
    <motion.div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${colorClasses[color].bg} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}