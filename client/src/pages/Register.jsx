import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import { registerStart, registerSuccess, registerFailure } from "../Redux/UserSlice";

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

  const handleRegister = async (formData) => {
    dispatch(registerStart());
    
    try {
      const response = await axios.post('/api/auth/register', formData);
      
      // Verify all required fields exist based on role
      if (formData.role === 'student' && !response.data.user.registrationNumber) {
        throw new Error('Registration number missing in response');
      }
  
      if ((formData.role === 'lecturer' || formData.role === 'HOD') && 
          (!response.data.user.employeeNumber || !response.data.user.title)) {
        throw new Error('Staff information incomplete in response');
      }
  
      const userData = response.data.user;
      const user = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,  // This is the correct path
        department: userData.department,
        phoneNumber: userData.phoneNumber,
        ...(userData.role === 'student' && { 
          registrationNumber: userData.registrationNumber 
        }),
        ...((userData.role === 'lecturer' || userData.role === 'HOD') && {
          title: userData.title,
          employeeNumber: userData.employeeNumber
        })
      };
  
      dispatch(registerSuccess(user));
      localStorage.setItem('token', response.data.token);
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("userRole", userData.role);  // Changed from response.data.userRole to userData.role
      
      console.log('Stored auth data:', {
        token: response.data.token,
        userRole: userData.role,  // Fixed here
        localStorage: {
          token: localStorage.getItem('token'),
          authToken: localStorage.getItem('authToken'),
          userRole: localStorage.getItem('userRole')
        }
      });
      
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch(registerFailure(errorMessage));
      throw errorMessage;
    }
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

    try {
      const user = await handleRegister(formData);
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
    } catch (error) {
      toast.error(error || "Registration failed. Please try again.");
    }
  };

  // (Keep the rest of your JSX the same)
  return (
    // ... your existing JSX
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