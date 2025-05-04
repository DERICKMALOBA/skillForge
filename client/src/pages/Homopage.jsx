import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChalkboardTeacher, FaUserGraduate, FaUserTie, FaBookOpen, FaVideo, FaChartLine } from 'react-icons/fa';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-1">
              <FaBookOpen className="text-indigo-600 text-2xl" />
              <span className="font-bold text-xl text-indigo-800">SkillForge</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
              <a href="#about" className="text-gray-700 hover:text-indigo-600">About</a>
              <Link 
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
            >
              Transform Your <span className="text-indigo-600">Learning Experience</span>
            </motion.h1>
            <p className="text-lg text-gray-600 mb-8">
              SkillForge provides a comprehensive e-learning platform with live lectures, 
              real-time chat, and powerful analytics for students, lecturers, and HODs.
            </p>
            <div className="flex space-x-4">
              <Link 
                to="/register"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Get Started
              </Link>
              <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white p-8 rounded-xl shadow-xl">
              <div className="flex border-b border-gray-200 mb-6">
                <Link 
                  to="/login" 
                  className={`px-4 py-2 font-medium ${window.location.pathname === '/login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className={`px-4 py-2 font-medium ${window.location.pathname === '/register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                >
                  Register
                </Link>
              </div>
              
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Join SkillForge to access all features
                </h3>
                <div className="space-y-4">
                  <Link 
                    to="/login"
                    className="block w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    className="block w-full border border-indigo-600 text-indigo-600 font-bold py-2 px-4 rounded hover:bg-indigo-50 transition"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaVideo className="text-4xl text-indigo-600 mb-4" />,
                title: "Live Lectures",
                description: "Interactive real-time video streaming with Q&A functionality for engaging learning sessions."
              },
              {
                icon: <FaBookOpen className="text-4xl text-indigo-600 mb-4" />,
                title: "Resource Library",
                description: "Centralized access to e-books, lecture notes, and recorded sessions for all courses."
              },
              {
                icon: <FaChartLine className="text-4xl text-indigo-600 mb-4" />,
                title: "Advanced Analytics",
                description: "Comprehensive reports on student performance, attendance, and resource utilization."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-md transition"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Type Benefits */}
      <section className="py-16 px-4 bg-indigo-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Designed For</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaUserGraduate className="text-4xl text-indigo-600 mb-4" />,
                title: "Students",
                benefits: [
                  "Interactive learning experience",
                  "Access to course materials anytime",
                  "Real-time communication with lecturers",
                  "Personalized learning recommendations"
                ]
              },
              {
                icon: <FaChalkboardTeacher className="text-4xl text-indigo-600 mb-4" />,
                title: "Lecturers",
                benefits: [
                  "Easy lecture delivery tools",
                  "Automated attendance tracking",
                  "Student performance analytics",
                  "Resource management system"
                ]
              },
              {
                icon: <FaUserTie className="text-4xl text-indigo-600 mb-4" />,
                title: "HODs",
                benefits: [
                  "Department-wide analytics",
                  "Resource utilization reports",
                  "Performance benchmarking",
                  "Curriculum planning tools"
                ]
              }
            ].map((user, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl hover:shadow-md transition"
              >
                <div className="text-center">
                  {user.icon}
                  <h3 className="text-xl font-semibold mb-4">{user.title}</h3>
                </div>
                <ul className="space-y-2">
                  {user.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-500 mr-2">✓</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">SkillForge</h3>
            <p className="text-gray-400">
              Transforming education through innovative e-learning solutions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link to="#features" className="text-gray-400 hover:text-white">Features</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
              <li><Link to="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
              <li><Link to="/status" className="text-gray-400 hover:text-white">System Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <p className="text-gray-400 mb-2">info@skillforge.edu</p>
            <p className="text-gray-400">+254 111269996</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>© {new Date().getFullYear()} SkillForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;