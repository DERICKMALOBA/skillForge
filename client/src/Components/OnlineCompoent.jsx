import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../LiveLecture/socket';

export default function OnlineClasses() {
  const [liveLectures, setLiveLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect socket when component mounts
    socket.connect();

    // Fetch initial list of active lectures
    const fetchActiveLectures = async () => {
      try {
        const response = await fetch('/api/lectures/active');
        const data = await response.json();
        setLiveLectures(data);
      } catch (error) {
        console.error('Error fetching lectures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLectures();

    // Listen for new lectures
    socket.on('lecture-created', (lecture) => {
      setLiveLectures(prev => [...prev, lecture]);
    });

    // Listen for lectures ending
    socket.on('lecture-ended', (lectureId) => {
      setLiveLectures(prev => prev.filter(l => l.id !== lectureId));
    });

    // Clean up on unmount
    return () => {
      socket.off('lecture-created');
      socket.off('lecture-ended');
      socket.disconnect();
    };
  }, []);

  const joinLecture = (lectureId) => {
    navigate(`/live-lecture/${lectureId}`);
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
        Join live lectures, access recorded sessions, and interact with instructors.
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
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}