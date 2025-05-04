import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BookOpen, Calendar, FileText, Bell, Clock } from "react-feather";

export default function DashboardOverview() {
  const user = useSelector((state) => state.user.user);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time helper function
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch assignments
        const assignmentsRes = await fetch("/api/student/assignments/all");
        if (!assignmentsRes.ok) throw new Error("Failed to fetch assignments");
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.data || []);

        // Fetch materials
        const materialsRes = await fetch("/api/student/materials/all");
        if (!materialsRes.ok) throw new Error("Failed to fetch materials");
        const materialsData = await materialsRes.json();
        setMaterials(materialsData.data || []);

        // Fetch upcoming lectures
        const lecturesRes = await fetch("/api/schedule/student-schedules", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!lecturesRes.ok) throw new Error("Failed to fetch lectures");
        const lecturesData = await lecturesRes.json();
        setLectures(lecturesData.schedules || []);

        // Fetch announcements
        const announcementsRes = await fetch("/api/hod/announcements");
        if (!announcementsRes.ok)
          throw new Error("Failed to fetch announcements");
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || []);
      } catch (err) {
        setError(err.message);
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl shadow-lg mb-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold">Student Dashboard</h1>
        <p className="text-blue-100 mt-2">
          Welcome back, <span className="font-semibold">{user.name}</span>
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Assignments Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Assignments</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {assignments.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {assignments.filter(a => a.status === 'submitted').length} submitted
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Materials Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Materials</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {materials.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {materials.slice(0, 3).map(m => m.type).join(', ')}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Upcoming Lectures Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Lectures</h3>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {lectures.length}
              </p>
              {lectures.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Next: {formatDate(lectures[0].startTime)}
                </p>
              )}
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Announcements Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Announcements</h3>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {announcements.length}
              </p>
              {announcements.length > 0 && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Latest: {announcements[0].title}
                </p>
              )}
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Lectures List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Lectures
            </h2>
          </div>
          <div className="p-4">
            {lectures.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No upcoming lectures scheduled
              </div>
            ) : (
              <ul className="space-y-3">
                {lectures.slice(0, 5).map((lecture) => (
                  <li key={lecture._id} className="border-l-4 border-purple-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{lecture.title}</h4>
                        {lecture.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {lecture.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="flex items-center text-gray-500">
                            <span className="font-medium mr-1">Starts:</span>
                            <span>{formatDate(lecture.startTime)}</span>
                            <span className="mx-1">•</span>
                            <span>{formatTime(lecture.startTime)}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <span className="font-medium mr-1">Ends:</span>
                            <span>{formatTime(lecture.endTime)}</span>
                          </div>
                        </div>
                      </div>
                      {lecture.lecturer && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full whitespace-nowrap">
                          {lecture.lecturer.title}. {lecture.lecturer.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Recent Assignments
            </h2>
          </div>
          <div className="p-4">
            {assignments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No assignments yet
              </div>
            ) : (
              <ul className="space-y-3">
                {assignments.slice(0, 5).map((assignment) => (
                  <li key={assignment._id} className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{assignment.title}</h4>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.status === "submitted" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 text-white">
            <h2 className="text-lg font-semibold flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Latest Announcements
            </h2>
          </div>
          <div className="p-4">
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No announcements yet
              </div>
            ) : (
              <ul className="space-y-3">
                {announcements.slice(0, 5).map((announcement) => (
                  <li key={announcement._id} className="border-l-4 border-orange-500 pl-3 py-2 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{announcement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {announcement.message}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(announcement.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}