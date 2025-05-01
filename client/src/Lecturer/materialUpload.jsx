import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import { FaUpload, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive, FaFileImage, FaFileVideo, FaTimes } from "react-icons/fa";


export default function UploadMaterials({ user,courses, onClose }) {
  console.log("User:", user); // <-- Should show lecturer info
  console.log("Courses:", courses);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [metadata, setMetadata] = useState({
    courseId: courses.length > 0 ? courses[0]._id : "",
    module: "",
    title: "",
    description: "",
    tags: [],
    visibility: "public",
    availableFrom: new Date().toISOString().split('T')[0],
    availableTo: "",
    license: "educational"
  });
  const fileInputRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    return () => {
      // Clean up object URLs
      selectedFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [selectedFiles]);

  useEffect(() => {
    const fetchStudentsAndCourse = async () => {
      if (!metadata.courseId) return;
      
      setIsFetchingStudents(true);
      try {
        // Fetch students
        const studentsResponse = await fetch('/api/hod/students');
        if (!studentsResponse.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Find course details from props instead of fetching
        const courseData = courses.find(course => course._id === metadata.courseId);
        if (!courseData) throw new Error("Course not found");
        setCourseDetails(courseData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setUploadError("Failed to load student list or course details. Notifications may not work.");
      } finally {
        setIsFetchingStudents(false);
      }
    };

    fetchStudentsAndCourse();
  }, [metadata.courseId, courses]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    const fileToRemove = selectedFiles.find(f => f.id === id);
    if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setMetadata(prev => ({ ...prev, tags }));
  };

  const sendMaterialNotifications = async (uploadedMaterials = []) => {
    console.log("=== STARTING NOTIFICATION PROCESS ===");
    console.log("Uploaded Materials:", uploadedMaterials);
    console.log("Current User:", user);
    console.log("Course Details:", courseDetails);
    console.log("Students:", students);
  
    if (!Array.isArray(uploadedMaterials) || uploadedMaterials.length === 0) {
      console.warn("No materials to notify students about.");
      return {
        status: 'warning',
        message: 'No materials to notify about.',
      };
    }
  
    if (!students.length || !courseDetails) {
      console.warn("Missing students or course details. Students:", students.length, "Course Details:", !!courseDetails);
      return {
        status: 'warning',
        message: 'Students or course details missing. Notification skipped.',
      };
    }
  
    try {
      const studentIds = students.map(student => student._id);
      console.log("Student IDs to notify:", studentIds);
  
      const notificationPayload = {
        lecturerId: user.id || user._id,
        studentIds,
        title: metadata.title || "New Course Materials",
        description: `${metadata.description}`,
        courseName: courseDetails.courseName,
        startTime: metadata.availableFrom,
        endTime: metadata.availableTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
  
      console.log("Notification Payload:", notificationPayload);
  
      const response = await fetch('/api/notify/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user.role || user._role,
        },
        body: JSON.stringify(notificationPayload),
        credentials: 'include',
      });
  
      console.log("Notification Response Status:", response.status);
      
      const data = await response.json();
      console.log("Notification Response Data:", data);
  
      if (!response.ok) {
        throw new Error(data.message || "Notification failed");
      }
  
      return {
        status: 'success',
        message: 'Students successfully notified',
      };
    } catch (error) {
      console.error('Notification error:', error);
      return {
        status: 'warning',
        message: 'Materials uploaded but student notifications failed',
        error: error.message
      };
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedFiles.length) {
      toast.error("Please select at least one file.");
      return;
    }
  
    setIsUploading(true);
    setUploadError(null);
  
    const formData = new FormData();
    formData.append('metadata', JSON.stringify({
      ...metadata,
      courseName: courseDetails?.courseName || ""
    }));
  
    selectedFiles.forEach(fileObj => {
      formData.append('files', fileObj.file);
    });
  
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
      const response = await fetch('/api/lecturer/materials', {
        method: 'POST',
        headers: {
          'lecturer-id': user.id || user._id,
          'X-User-Role': user.role || user._role
        },
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
  
      // ✅ Always try sending notifications
      const notificationResult = await sendMaterialNotifications(data.materials);
  
      toast.success(`✅ Uploaded ${data.count} file(s). ${notificationResult.message}`);
  
      // Reset form
      setSelectedFiles([]);
      setMetadata(prev => ({
        ...prev,
        module: "",
        title: "",
        description: "",
        tags: [],
      }));
  
      if (onClose) onClose();
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadError(error.message || "Unknown upload error");
      toast.error(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  

  const getFileIcon = (type) => {
    const icons = {
      pdf: <FaFilePdf className="text-red-500" />,
      word: <FaFileWord className="text-blue-500" />,
      excel: <FaFileExcel className="text-green-500" />,
      powerpoint: <FaFilePowerpoint className="text-orange-500" />,
      archive: <FaFileArchive className="text-yellow-500" />,
      image: <FaFileImage className="text-purple-500" />,
      video: <FaFileVideo className="text-blue-400" />
    };

    if (type.includes('pdf')) return icons.pdf;
    if (type.includes('word')) return icons.word;
    if (type.includes('excel') || type.includes('spreadsheet')) return icons.excel;
    if (type.includes('powerpoint') || type.includes('presentation')) return icons.powerpoint;
    if (type.includes('zip') || type.includes('compressed')) return icons.archive;
    if (type.includes('image')) return icons.image;
    if (type.includes('video')) return icons.video;
    return icons.pdf;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-lg max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Course Materials</h2>
      
      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  name="courseId"
                  value={metadata.courseId}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseName} ({course.courseCode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module/Unit</label>
                <input
                  type="text"
                  name="module"
                  value={metadata.module}
                  onChange={handleMetadataChange}
                  placeholder="e.g., Module 1: Introduction"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={metadata.title}
                onChange={handleMetadataChange}
                placeholder="Material title"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Description</label>
              <textarea
                name="description"
                value={metadata.description}
                onChange={handleMetadataChange}
                placeholder="Brief description of the material"
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={metadata.tags.join(', ')}
                onChange={handleTagChange}
                placeholder="e.g., lecture notes, assignment, reference"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  name="visibility"
                  value={metadata.visibility}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public">Public (All students)</option>
                  <option value="private">Private (Selected students)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                <input
                  type="date"
                  name="availableFrom"
                  value={metadata.availableFrom}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Until (optional)</label>
                <input
                  type="date"
                  name="availableTo"
                  value={metadata.availableTo}
                  onChange={handleMetadataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.zip"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <FaUpload className="text-4xl text-gray-400" />
                <p className="text-gray-600">Drag & drop files here or click to browse</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select Files
                </button>
                <p className="text-xs text-gray-500">Supports PDF, DOCX, PPTX, XLSX, images, videos (max 100MB each)</p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        {file.preview ? (
                          <img src={file.preview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="text-2xl">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)} • {file.type}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        aria-label="Remove file"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedFiles.length === 0 || isUploading || isFetchingStudents}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  selectedFiles.length === 0 || isUploading || isFetchingStudents
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>

            {isFetchingStudents && (
              <div className="text-sm text-gray-500">
                Loading student list for notifications...
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
            No courses available. Please contact administration to be assigned to courses.
          </div>
        )}
      </form>
     
    </motion.div>
  );
}