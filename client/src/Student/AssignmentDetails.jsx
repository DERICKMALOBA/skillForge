// AssignmentDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/student/courses/${courseId}/assignments/${assignmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const { data } = await response.json();
        setAssignment(data);
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [courseId, assignmentId]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) return <div className="p-4 text-center">Loading assignment details...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!assignment) return <div className="p-4 text-red-500">Assignment not found</div>;

  return (
    <div className="p-4 space-y-6">
      <button 
        onClick={handleGoBack}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        ← Back to Assignments
      </button>

      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{assignment.title}</h2>
            <p className="text-gray-600 mt-1">
              {assignment.courseInfo?.courseCode} - {assignment.courseInfo?.courseName}
            </p>
          </div>
          {assignment.isOverdue ? (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
              Overdue
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              Due in {assignment.daysRemaining} day{assignment.daysRemaining !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="mt-2 text-gray-700">{assignment.description || 'No description provided'}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Instructions</h3>
            <p className="mt-2 text-gray-700">{assignment.instructions || 'No specific instructions'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Due Date</h4>
              <p className="mt-1">{new Date(assignment.dueDate).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Max Points</h4>
              <p className="mt-1">{assignment.maxPoints || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium">Submission Type</h4>
              <p className="mt-1 capitalize">{assignment.submissionType || 'Not specified'}</p>
            </div>
          </div>

          {assignment.fileRequirements && (
            <div>
              <h3 className="text-lg font-semibold">File Requirements</h3>
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(assignment.fileRequirements).map(([key, value]) => (
                  <li key={key} className="capitalize">
                    {key}: {value.toString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}