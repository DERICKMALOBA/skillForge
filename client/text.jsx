import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChalkboardTeacher, FaBook, FaVideo, FaTasks,
  FaComments, FaSignOutAlt, FaUpload, FaChartBar
} from "react-icons/fa";
import { useSelector } from "react-redux";

export default function LecturerDashboard() {
  const user = useSelector((state) => state.user.user);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sections = {
    dashboard: "Dashboard Overview",
    lectures: "Create a Live Lecture",
    resources: "Upload Course Materials",
    assignments: "Give Assignments",
    chat: "Student Chats",
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.aside
        className="w-64 bg-blue-800 text-white p-6"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <h1 className="text-xl font-bold mb-4">Welcome, {user?.name}!</h1>

        {/* Navigation */}
       <nav className="space-y-3">
                {Object.keys(sections).map((key) => (
                  <motion.button
                    key={key}
                    className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-300
                      ${activeSection === key ? "bg-primary-light text-white" : "hover:bg-primary-dark"}
                    `}
                    onClick={() => setActiveSection(key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{getIcon(key)}</span>
                    <span className="whitespace-nowrap">{sections[key]}</span>
                  </motion.button>
                ))}
              </nav>

        {/* Logout Button */}
        <motion.button
          className="flex items-center space-x-3 w-full p-3 mt-8 bg-red-600 text-white 
          rounded-lg hover:bg-red-700 transition"
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
        <nav className="flex justify-between items-center bg-white shadow-md p-4">
          <h1 className="text-lg font-bold">Lecturer Dashboard</h1>
          <div className="flex items-center space-x-4">
            <p className="text-sm font-semibold">{currentTime}</p>
            <div className="flex items-center space-x-2">
              <img src={user?.photo} alt="Lecturer" className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.department}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Section */}
        <main className="flex-1 p-8">
          <motion.h1
            className="text-2xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {sections[activeSection]}
          </motion.h1>

          {activeSection === "dashboard" ? (
            <DashboardContent user={user} />
          ) : (
            <motion.div
              className="p-6 bg-white rounded-lg shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-600">
                Content for {sections[activeSection]} will be displayed here.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

/* Function to Return Icons */
function getIcon(section) {
  const icons = {
    dashboard: <FaChalkboardTeacher />,
    lectures: <FaVideo />,
    resources: <FaBook />,
    assignments: <FaTasks />,
    chat: <FaComments />,
  };
  return icons[section] || <FaChalkboardTeacher />;
}

/* Dashboard Overview Content */
function DashboardContent({ user }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quick Stats */}
      <StatCard icon={<FaBook />} title="Total Courses" value="4" />
      <StatCard icon={<FaVideo />} title="Live Lectures Today" value="2 Scheduled" />
      <StatCard icon={<FaUpload />} title="Uploaded Resources" value="15 Materials" />
      <StatCard icon={<FaTasks />} title="Pending Assignments" value="3 to Grade" />
      <StatCard icon={<FaComments />} title="Student Messages" value="5 Unread" />

      {/* Upcoming Schedule */}
      <motion.div className="p-6 bg-white rounded-lg shadow-lg col-span-2">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Upcoming Lectures</h2>
        <ul className="text-gray-600">
          <li>📖 Data Structures – 10:00 AM <a href="#" className="text-blue-600">[Join]</a></li>
          <li>💻 Web Development – 2:00 PM <a href="#" className="text-blue-600">[Join]</a></li>
        </ul>
      </motion.div>

      {/* Announcements */}
      <motion.div className="p-6 bg-white rounded-lg shadow-lg col-span-2">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Announcements</h2>
        <p className="text-gray-600">⚠️ Midterm exams should be uploaded by **Oct 15**.</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton title="Start Lecture" icon={<FaVideo />} />
          <ActionButton title="Upload Materials" icon={<FaUpload />} />
          <ActionButton title="Grade Assignments" icon={<FaTasks />} />
          <ActionButton title="Reply to Messages" icon={<FaComments />} />
        </div>
      </motion.div>
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
function ActionButton({ title, icon }) {
  return (
    <motion.button className="p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700">
      {icon}
      <span>{title}</span>
    </motion.button>
  );
}





















import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import { registerUser } from "../Redux/UserSlice";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    title: "",
    role: "student",
    registrationNumber: "",
    employeeNumber: "",
    department: "",
    phoneNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || !formData.email || !formData.password || !formData.department || !formData.phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.role === "student" && !formData.registrationNumber) {
      toast.error("Registration number is required for students");
      return;
    }

    if ((formData.role === "lecturer" || formData.role === "HOD") && (!formData.employeeNumber || !formData.title)) {
      toast.error("Employee number and title are required for staff");
      return;
    }

    dispatch(registerUser(formData))
      .unwrap()
      .then((user) => {
        toast.success("Registration successful!");
        switch (user.role) {
          case "student":
            navigate("/student-dashboard");
            break;
          case "lecturer":
            navigate("/lecturer-dashboard");
            break;
          case "HOD":
            navigate("/hod-dashboard");
            break;
          default:
            navigate("/login");
        }
      })
      .catch((error) => {
        toast.error(error || "Registration failed. Please try again.");
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Join SkillForge
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                minLength="6"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="HOD">Head of Department</option>
            </select>
          </div>

          {formData.role === "student" && (
            <div>
              <label className="block text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required={formData.role === "student"}
                placeholder="e.g., BIT/028/19"
              />
            </div>
          )}

          {(formData.role === "lecturer" || formData.role === "HOD") && (
            <>
              <div>
                <label className="block text-gray-700 mb-1">Employee Number</label>
                <input
                  type="text"
                  name="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Title</label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Select Title</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : "Register"}
          </button>

          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;