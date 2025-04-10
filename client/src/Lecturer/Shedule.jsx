import { motion } from "framer-motion";
import { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";

export default function ScheduleLectures({ courses, user }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduledLectures, setScheduledLectures] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => { 
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      if (!user || !user._id) {
        throw new Error("User session not available. Please log in again.");
      }
  
      // Fetch all students
      const studentsRes = await fetch('/api/hod/students');
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
  
      const studentsData = await studentsRes.json();
      const studentIds = studentsData.map(student => student._id); // 👈 Use all students
  
      if (!startTime || !endTime) {
        throw new Error("Please select both start and end times");
      }
  
      const scheduleData = {
        lecturerId: user._id,
        studentIds,
        title: lectureTitle,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      };
  
      const response = await fetch('/api/schedule/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
        credentials: 'include'
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule lecture');
      }
  
      setScheduledLectures([...scheduledLectures, {
        ...data.schedule,
        studentsCount: studentIds.length
      }]);
  
      // Clear form
      setLectureTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setSelectedCourse("");
  
      toast.success("Lecture scheduled and emails sent to all students!");
  
    } catch (error) {
      console.error("Error scheduling lecture:", error);
      toast.error(error.message || "Failed to schedule lecture");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const formatDateTime = (dateTimeString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateTimeString).toLocaleString(undefined, options);
  };

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-lg"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaCalendarAlt className="mr-2" /> Schedule New Lecture
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Course
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.courseCode} - {course.courseName} 
                {course.enrolledStudents?.length > 0 ? ` (${course.enrolledStudents.length} students)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lecture Title
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Scheduling..." : "Schedule Lecture"}
        </button>
      </form>

      {scheduledLectures.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Upcoming Lectures</h3>
          <div className="space-y-3">
            {scheduledLectures.map((lecture) => (
              <div key={lecture._id} className="p-3 border border-gray-200 rounded-md">
                <h4 className="font-medium">{lecture.title}</h4>
                {lecture.description && (
                  <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Time:</span> {formatDateTime(lecture.startTime)} - {formatDateTime(lecture.endTime)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold">Course:</span> {lecture.courseName}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Notifications sent to  students
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}