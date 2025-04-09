import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Bell, Users, FileText, BookOpen } from "lucide-react";
import { logoutUser } from "../redux/userSlice";
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
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg">
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 border rounded">
            <Bell className="w-5 h-5 mr-2" /> Notifications
          </button>
          <div>
            <h1 className="text-xl font-semibold">{user?.name}</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold">HOD Dashboard</h1>
      </header>

      {/* Overview Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Lecturers Section */}
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium">Total Lecturers</h3>
            <p className="text-2xl font-bold">{lecturers.length}</p>
            <button className="mt-2 text-blue-700 px-3 py-1 rounded text-sm hover:underline">
              View Lecturers
            </button>
          </div>
          <Users className="w-12 h-12 text-blue-500 ml-4" />
        </div>

        {/* Students Section */}
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium">Total Students</h3>
            <p className="text-2xl font-bold">{students.length}</p>
            <button className="mt-2 text-green-700 px-3 py-1 rounded text-sm hover:underline">
              View Students
            </button>
          </div>
          <Users className="w-12 h-12 text-green-500 ml-4" />
        </div>

        {/* Courses Section */}
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium">Total Courses</h3>
            <p className="text-2xl font-bold">{courses.length}</p>
            <button className="mt-2 text-purple-700 px-3 py-1 rounded text-sm hover:underline">
              View Courses
            </button>
          </div>
          <BookOpen className="w-12 h-12 text-purple-500 ml-4" />
        </div>
      </div>

      {/* Assign Lecturer to Course and Add Course */}
     {/* Assign Lecturer to Course and Add Course */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  {/* Assign Lecturer to Course */}
  <section className="bg-white p-6 rounded shadow">
    <h2 className="text-xl font-semibold mb-4">Assign Lecturer to Course</h2>
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <select
          className="border p-2 rounded w-full"
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.courseCode} - {course.courseName}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded w-full"
          onChange={(e) => setSelectedLecturer(e.target.value)}
        >
          <option value="">Select Lecturer</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer._id} value={lecturer._id}>
              {lecturer.name}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
          onClick={assignLecturer}
        >
          Assign
        </button>
      </div>
    </div>
  </section>

  {/* Add Course */}
  <section className="bg-white p-6 rounded shadow">
    <h2 className="text-xl font-semibold mb-4">Add Course</h2>
    <div className="space-y-3">
      <input
        type="text"
        placeholder="New course name..."
        className="border p-2 rounded w-full"
        value={newCourse}
        onChange={(e) => setNewCourse(e.target.value)}
      />
      <input
        type="text"
        placeholder="Course code..."
        className="border p-2 rounded w-full"
        value={courseCode}
        onChange={(e) => setCourseCode(e.target.value)}
      />
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full mt-2"
        onClick={addCourse}
      >
        Add Course
      </button>
    </div>
  </section>
</div>

      {/* Announcements and Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Announcements */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Announcements</h2>
          <input
            type="text"
            placeholder="New announcement..."
            className="border p-2 w-full"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded mt-2"
            onClick={addAnnouncement}
          >
            Add Announcement
          </button>

          <ul className="mt-4">
            {announcements.map((ann, index) => (
              <li key={index} className="border-b p-2">
                {ann.message}
              </li>
            ))}
          </ul>
        </section>

        {/* Reports */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Reports</h2>
          <button className="bg-gray-500 text-white px-4 py-2 rounded flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Download Report
          </button>
          <button onClick={handleLogout}>
            logout
          </button>
        </section>
      </div>
    </div>
  );
};

export default HODDashboard;
