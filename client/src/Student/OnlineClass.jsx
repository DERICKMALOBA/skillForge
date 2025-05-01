import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../LiveLecture/socket';
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function OnlineClasses() {
  const [liveLectures, setLiveLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const token = useSelector((state) => state.user.token) || localStorage.getItem('token');

  useEffect(() => {
    const fetchActiveLectures = async () => {
      try {
        const response = await fetch('/api/lectures/active');
        
        if (!response.ok) {
          throw new Error('Failed to fetch lectures');
        }

        const data = await response.json();
        setLiveLectures(data.lectures || []);
      } catch (error) {
        console.error('Error fetching lectures:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLectures();

    // Socket listeners for real-time updates
    const handleLectureCreated = (lecture) => {
      setLiveLectures(prev => [...prev, lecture]);
    };

    const handleLectureEnded = (lectureId) => {
      setLiveLectures(prev => prev.filter(l => l.id !== lectureId));
    };

    return () => {
      socket.off('lecture-created');
      socket.off('lecture-ended');
    };
  }, []);

  const joinLecture = async (lectureId) => {
    if (!user?._id) {
      toast.error('Please login to join lectures');
      return;
    }
  
    setJoining(true);
    try {
      // Step 1: Verify lecture exists and get info
      const infoResponse = await fetch(`http://localhost:8000/api/lectures/${lectureId}/info`);
      if (!infoResponse.ok) {
        const errorData = await infoResponse.json();
        throw new Error(errorData.error || 'Lecture not available');
      }
  
      // Step 2: Join the lecture
      const joinResponse = await fetch(`http://localhost:8000/api/lectures/${lectureId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: user._id,
          studentName: user.name
        })
      });
  
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join lecture');
      }
  
      // Step 3: Navigate to live lecture
      const { courseName, lecturerName } = await joinResponse.json();
      console.log(`Joined ${courseName} by ${lecturerName}`);
      navigate(`/live/${lectureId}`);
    } catch (error) {
      console.error('Join error:', error);
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-5 p-5 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Loading lectures...</h2>
      </div>
    );
  }

  return (
    <div className="mt-5 p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-3">Online Classes</h2>
      <p className="text-gray-600 mb-4">
        Join live lectures, access recorded sessions, and interact with instructors in real time.
      </p>

      <div className="space-y-4">
        <h3 className="font-medium text-lg">Active Live Lectures</h3>
        
        {liveLectures.length === 0 ? (
          <p className="text-gray-500">No live lectures currently available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveLectures.map((lecture) => (
              <div key={lecture.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{lecture.courseName || 'Live Lecture'}</h4>
                    <p className="text-sm text-gray-500">
                      Hosted by: {lecture.lecturerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lecture.participantCount || 0} students attending
                    </p>
                  </div>
                  <button
                    onClick={() => joinLecture(lecture.id)}
                    disabled={joining}
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                      joining ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-lg">Recorded Sessions</h3>
        <p className="text-gray-500 mt-2">Coming soon...</p>
      </div>
    </div>
  );
}