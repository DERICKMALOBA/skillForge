import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaFileUpload, FaFileAlt, FaTrash } from "react-icons/fa";
import { toast } from 'react-toastify';

export default function GiveAssignments({ user, courses, onClose }) {
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [courseDetails, setCourseDetails] = useState(null);
  
    const [formData, setFormData] = useState({
        courseId: courses.length > 0 ? courses[0]._id : "",
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        maxPoints: 100,
        submissionType: "both",
        allowedFileTypes: ".pdf,.doc,.docx,.ppt,.pptx",
        maxFileSize: 10, // in MB
        allowMultipleAttempts: false,
        notifyStudents: true,
    });

    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchStudentsAndCourse = async () => {
            if (!formData.courseId) return;
            
            setIsFetchingStudents(true);
            try {
                // Fetch students
                const studentsResponse = await fetch('/api/hod/students');
                if (!studentsResponse.ok) throw new Error("Failed to fetch students");
                const studentsData = await studentsResponse.json();
                setStudents(studentsData);

                // Find course details from props
                const courseData = courses.find(course => course._id === formData.courseId);
                if (!courseData) throw new Error("Course not found");
                setCourseDetails(courseData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load student list or course details. Notifications may not work.");
            } finally {
                setIsFetchingStudents(false);
            }
        };

        fetchStudentsAndCourse();
    }, [formData.courseId, courses]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        const validFiles = newFiles.filter(file => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = formData.allowedFileTypes
                .split(',')
                .map(ext => ext.trim().replace('.', ''));
            
            return allowedExtensions.includes(fileExtension) && 
                   file.size <= formData.maxFileSize * 1024 * 1024;
        });

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccess(false);
        setError('');

        if (!user || !user._id) {
            setError("User session not available. Please log in again.");
            setIsSubmitting(false);
            return;
        }

        if (!formData.courseId) {
            setError('Please select a course');
            setIsSubmitting(false);
            return;
        }
        if (!formData.title.trim()) {
            setError('Please enter an assignment title');
            setIsSubmitting(false);
            return;
        }
        if (!formData.dueDate) {
            setError('Please set a due date');
            setIsSubmitting(false);
            return;
        }

        try {
            const formDataToSend = new FormData();

            // Append assignment details
            formDataToSend.append('courseId', formData.courseId);
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('instructions', formData.instructions);
            formDataToSend.append('dueDate', formData.dueDate);
            formDataToSend.append('maxPoints', formData.maxPoints.toString());
            formDataToSend.append('submissionType', formData.submissionType);
            formDataToSend.append('allowedFileTypes', formData.allowedFileTypes);
            formDataToSend.append('maxFileSize', formData.maxFileSize.toString());
            formDataToSend.append('allowMultipleAttempts', formData.allowMultipleAttempts.toString());
            formDataToSend.append('notifyStudents', formData.notifyStudents.toString());
            formDataToSend.append('lecturerId', user._id);

            // Include all student IDs if notification is enabled
            if (formData.notifyStudents && students.length) {
                const studentIds = students.map(student => student._id);
                formDataToSend.append('studentIds', JSON.stringify(studentIds));
            }

            // Append files
            files.forEach(file => {
                formDataToSend.append('files', file);
            });

            const response = await fetch("/api/assignments/create", {
                method: "POST",
                body: formDataToSend,
                headers: {
                    'x-user-role': user.role,
                    'lecturer-id': user._id // Add lecturer-id header
                },
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Assignment creation failed");
            }

            toast.success("✅ Assignment created successfully!");
            if (formData.notifyStudents) {
                toast.success(`📢 Notified ${students.length} students`);
            }

            setSuccess(true);
            setFormData({
                courseId: courses.length > 0 ? courses[0]._id : "",
                title: "",
                description: "",
                instructions: "",
                dueDate: "",
                maxPoints: 100,
                submissionType: "both",
                allowedFileTypes: ".pdf,.doc,.docx,.ppt,.pptx",
                maxFileSize: 10,
                allowMultipleAttempts: false,
                notifyStudents: true,
            });
            setFiles([]);
            setError('');
        } catch (error) {
            console.error("Error creating assignment:", error);
            setError(error.message || "Failed to create assignment");
            toast.error(`❌ Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    

    return (
        <motion.div
            className="p-6 bg-white rounded-lg shadow-lg max-w-3xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                Create New Assignment
            </h2>

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
                    Assignment created successfully! {formData.notifyStudents && "Students have been notified."}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Course Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course
                    </label>
                    <select
                        name="courseId"
                        value={formData.courseId}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>
                                {course.courseName} ({course.courseCode})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignment Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter assignment title"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of the assignment"
                    />
                </div>

                {/* Instructions */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detailed Instructions
                    </label>
                    <textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        rows={5}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide detailed instructions for students"
                    />
                </div>

                {/* Due Date */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FaCalendarAlt className="mr-2" /> Due Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Points */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Points
                    </label>
                    <input
                        type="number"
                        name="maxPoints"
                        value={formData.maxPoints}
                        onChange={handleChange}
                        min="1"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Submission Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Submission Type
                    </label>
                    <select
                        name="submissionType"
                        value={formData.submissionType}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="text">Text Only</option>
                        <option value="file">File Upload Only</option>
                        <option value="both">Both Text and File Upload</option>
                    </select>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-700">
                        Assignment Files (Optional)
                    </h3>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                            <FaFileUpload className="inline mr-2" />
                            Add Files
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            accept={formData.allowedFileTypes}
                        />
                        <span className="text-sm text-gray-500">
                            Max {formData.maxFileSize}MB per file ({formData.allowedFileTypes})
                        </span>
                    </div>

                    {/* Uploaded files list */}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <span className="truncate">
                                            <FaFileAlt className="inline mr-2 text-gray-500" />
                                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FaTrash />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Additional Options */}
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="allowMultipleAttempts"
                            checked={formData.allowMultipleAttempts}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        Allow Multiple Attempts
                    </label>

                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="notifyStudents"
                            checked={formData.notifyStudents}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        Notify Students via Email
                    </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <motion.button
                        type="submit"
                        className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-md ${
                            isSubmitting || isFetchingStudents ? "opacity-70" : "hover:bg-blue-700"
                        } transition-colors`}
                        disabled={isSubmitting || isFetchingStudents}
                        whileHover={!(isSubmitting || isFetchingStudents) ? { scale: 1.02 } : {}}
                        whileTap={!(isSubmitting || isFetchingStudents) ? { scale: 0.98 } : {}}
                    >
                        {isSubmitting 
                            ? "Creating Assignment..." 
                            : isFetchingStudents
                                ? "Loading student data..."
                                : "Create Assignment"}
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
}