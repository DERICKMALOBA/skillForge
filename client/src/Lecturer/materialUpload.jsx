import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive, FaFileImage, FaFileVideo, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function UploadMaterials({ courses, onClose }) {
  const user = useSelector((state) => state.user.user);
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

  useEffect(() => {
    return () => {
      // Clean up object URLs
      selectedFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [selectedFiles]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !user?.id) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    
    // Append metadata as JSON string
    formData.append('metadata', JSON.stringify(metadata));
    
    // Append files
    selectedFiles.forEach(fileObj => {
      formData.append('files', fileObj.file);
    });

    try {
      const response = await fetch('/api/lecturer/materials', {
        method: 'POST',
        body: formData,
        headers: {
          'lecturer-id': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      alert(`${data.count} material(s) uploaded successfully!`);
      setSelectedFiles([]);
      setMetadata(prev => ({
        ...prev,
        module: "",
        title: "",
        description: "",
        tags: []
      }));
      if (onClose) onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
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
                disabled={selectedFiles.length === 0 || isUploading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  selectedFiles.length === 0 || isUploading
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