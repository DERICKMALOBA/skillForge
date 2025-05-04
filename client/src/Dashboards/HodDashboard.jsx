import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Users, BookOpen,  LogOut } from "lucide-react";
import { logoutUser } from "../Redux/UserSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const HODDashboard = () => {
  const user = useSelector((state) => state.user.user); // Fetch user details from Redux
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  //fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/hod/announcements");
        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }
        const data = await response.json();
        setAnnouncements(data.announcements); // Update the announcements state
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  // Fetch lecturers, students, and courses
  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const response = await fetch(`/api/hod/lecturers`);
        if (!response.ok) throw new Error("Failed to fetch lecturers");
        const data = await response.json();
        setLecturers(data); // Update state
      } catch (error) {
        console.error("Error fetching lecturers:", error);
        setLecturers([]); // Fallback to empty array
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/hod/students`);
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        setStudents(data); // Update state
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]); // Fallback to empty array
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/hod/courses");
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data.courses || []); // Ensure it's an array
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]); // Fallback to empty array
      }
    };

    // Call all fetch functions
    fetchLecturers();
    fetchStudents();
    fetchCourses();
  }, []);

  // Assign Lecturer to Course
  const assignLecturer = () => {
    fetch("/api/hod/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId: selectedCourse,
        lecturerId: selectedLecturer,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to assign lecturer");
        }
        alert("Lecturer Assigned Successfully");
      })
      .catch((err) => console.error(err));
  };

  // Add Course
  const addCourse = () => {
    const courseData = {
      courseName: newCourse, // Use the value from the course name input
      courseCode: courseCode, // Use the value from the course code input
    };

    fetch("/api/hod/add-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData), // Send both courseName and courseCode
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add course");
        }
        return response.json();
      })
      .then((data) => {
        setCourses([...courses, data.course]); // Add the new course to the list
        setNewCourse(""); // Clear the course name input field
        setCourseCode(""); // Clear the course code input field
      })
      .catch((err) => console.error(err));
  };

  // Add Announcement
  const addAnnouncement = () => {
    fetch("/api/hod/announcement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: newAnnouncement }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add announcement");
        }
        return response.json();
      })
      .then((data) => {
        setAnnouncements([data.announcement, ...announcements]); // Add the new announcement to the top of the list
        setNewAnnouncement(""); // Clear the input field
      })
      .catch((err) => console.error(err));
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 shadow-sm rounded-xl mb-8">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {user?.name}
            </h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">HOD Dashboard</h1>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Lecturers Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-600">
                Total Lecturers
              </h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {lecturers.length}
              </p>
              <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
              </button>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-600">
                Total Students
              </h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {students.length}
              </p>
              <button className="mt-4 text-green-600 hover:text-green-800 font-medium text-sm flex items-center">
              </button>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Courses Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-600">
                Total Courses
              </h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {courses.length}
              </p>
              <button className="mt-4 text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
              </button>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assign Lecturer to Course */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">
            Assign Lecturer to Course
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecturer
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setSelectedLecturer(e.target.value)}
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer._id} value={lecturer._id}>
                      {lecturer.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={assignLecturer}
              >
                Assign Lecturer
              </button>
            </div>
          </div>
        </section>

        {/* Add Course */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">
            Add New Course
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                placeholder="Enter course name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                placeholder="Enter course code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
              />
            </div>

            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={addCourse}
            >
              Add Course
            </button>
          </div>
        </section>
      </div>

      {/* Announcements Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">
          Announcements
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Announcement
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter announcement"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
              />
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={addAnnouncement}
              >
                Post
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">
              Recent Announcements
            </h3>
            <ul className="space-y-3">
              {announcements.map((ann, index) => (
                <li
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-gray-800">{ann.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default HODDashboard;
