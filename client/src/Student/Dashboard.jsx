import { useEffect, useState } from "react";
import { useSelector } from "react-redux";


export default function DashboardOverview() {
  // Get student name from Redux
  const user = useSelector((state) => state.user.user); 

  // State for recent activity and deadlines from MongoDB
  const [recentActivity, setRecentActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [progress, setProgress] = useState(0);

  // Fetch student dashboard data from backend
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch("/api/student/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, // Ensure auth
        });
        const data = response.data;

        setRecentActivity(data.recentActivity);
        setDeadlines(data.deadlines);
        setProgress(data.progress);
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, []);

  return (
    <div className="mt-5 p-5 bg-white rounded-lg shadow-md">
      {/* Welcome Message */}
      <h2 className="text-xl font-semibold mb-3">Welcome, {user.name} 🎓</h2>
      <p className="text-gray-600">Track your progress, view announcements, and manage your student activities.</p>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
        {/* Recent Activity */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
          <ul className="list-disc list-inside text-gray-600">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => <li key={index}>{activity}</li>)
            ) : (
              <p>No recent activity</p>
            )}
          </ul>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Upcoming Deadlines</h3>
          <ul className="list-disc list-inside text-red-600">
            {deadlines.length > 0 ? (
              deadlines.map((deadline, index) => (
                <li key={index}>
                  <strong>{deadline.title}</strong> - {deadline.date}
                </li>
              ))
            ) : (
              <p>No upcoming deadlines</p>
            )}
          </ul>
        </div>

        {/* Progress Tracker */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium mb-2">Progress Tracker</h3>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              className="bg-blue-600 h-5 rounded-full text-white text-center text-sm"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
