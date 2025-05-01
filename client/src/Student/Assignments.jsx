import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AllAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllAssignments = async () => {
      try {
        const response = await fetch('/api/student/assignments/all');
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }

        const { data } = await response.json();
        setAssignments(data);
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAssignments();
  }, []);

  const handleViewAssignment = (courseId, assignmentId) => {
    if (courseId && assignmentId) {
      navigate(`/courses/${courseId}/assignments/${assignmentId}`);
    }
  };

  const handleSubmit = (courseId, assignmentId) => {
    if (courseId && assignmentId) {
      navigate(`/courses/${courseId}/assignments/${assignmentId}/submit`);
    }
  };

  const formatDueDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="p-4 text-center">Loading all assignments...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 space-y-6">
      
      
      {assignments.length === 0 ? (
        <div className="p-4 border rounded-lg text-center text-gray-500">
          No assignments found across all courses
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            // Safely get course info with fallbacks
            const courseCode = assignment.courseInfo?.courseCode || 'N/A';
            const courseName = assignment.courseInfo?.courseName || 'Unknown Course';
            const courseId = assignment.courseInfo?._id || null;
            
            return (
              <div key={assignment._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold">{assignment.title}</h3>
                      <span className="text-sm text-gray-600">
                        ({courseCode} - {courseName})
                      </span>
                      {assignment.isOverdue ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Overdue
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Due in {assignment.daysRemaining} day{assignment.daysRemaining !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-2">
                      {assignment.description && (
                        <p className="text-gray-700">{assignment.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">Due:</span> {formatDueDate(assignment.dueDate)}
                        </div>
                        <div>
                          <span className="font-medium">Points:</span> {assignment.maxPoints || 'N/A'}
                        </div>
                      
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col space-y-2 min-w-[120px]">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      onClick={() => handleViewAssignment(courseId, assignment._id)}
                      disabled={!courseId}
                    >
                      View Details
                    </button>
                    <button 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      onClick={() => handleSubmit(courseId, assignment._id)}
                      disabled={!courseId}
                    >
                      Submit Work
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}