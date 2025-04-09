import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export default function LecturerChat() {
  const user = useSelector((state) => state.user.user);
  const [socket, setSocket] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    if (!user) return;
  
    const newSocket = io("http://localhost:8000", {
      withCredentials: true,
      auth: {
        userId: user._id,
        role: user.role,
        ...(user.role === 'student' && { 
          registrationNumber: user.registrationNumber 
        })
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket']
    });
  
    // Handle connection errors
    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });
  
    // Handle reconnection attempts
    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    });
  
    setSocket(newSocket);
  
    return () => {
      newSocket.off('connect_error');
      newSocket.off('reconnect_attempt');
      newSocket.disconnect();
    };
  }, [user]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onPrivateMessage = (message) => {
      setMessages(prev => [...prev, message]);
      
      // If this is a new student, add them to the list
      if (!students.some(s => s._id === message.from)) {
        setStudents(prev => [...prev, {
          _id: message.from,
          name: message.fromName,
          regNumber: message.fromRegNumber,
          messageCount: 1
        }]);
      } else {
        // Update message count for existing student
        setStudents(prev => prev.map(student => 
          student._id === message.from 
            ? { ...student, messageCount: (student.messageCount || 0) + 1 } 
            : student
        ));
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('private_message', onPrivateMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('private_message', onPrivateMessage);
    };
  }, [socket, students]);

  // Load chat history when student is selected
  useEffect(() => {
    if (socket && selectedStudent) {
      socket.emit(
        "get_chat_history",
        { withUserId: selectedStudent._id },
        (response) => {
          if (response.status === "success") {
            setMessages(response.messages);
            // Update message count when loading chat history
            setStudents(prev => prev.map(student => 
              student._id === selectedStudent._id 
                ? { ...student, messageCount: response.messages.length } 
                : student
            ));
          } else {
            console.error(response.message);
          }
        }
      );
    }
  }, [socket, selectedStudent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Improved date formatting function
  const formatMessageDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Send message with immediate UI update
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent) return;

    // Create temporary message for immediate UI update
    const tempMessage = {
      _id: Date.now().toString(),
      from: user._id,
      to: selectedStudent._id,
      content: newMessage,
      timestamp: new Date().toISOString(), // Using timestamp instead of createdAt
      fromName: user.name,
      delivered: false
    };

    // Update UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Send message to server
    socket.emit("private_message", 
      { 
        to: selectedStudent._id, 
        content: newMessage 
      },
      (response) => {
        if (response.status === "delivered") {
          // Replace temporary message with server response
          setMessages(prev => prev.map(msg => 
            msg._id === tempMessage._id ? response.message : msg
          ));
        } else {
          console.error("Failed to send message:", response.message);
        }
      }
    );
  };

  return (
    <div className="flex h-full">
      {/* Students list */}
      <div className="w-1/4 border-r p-4">
        <h2 className="font-bold mb-4">Students</h2>
        <div className="space-y-2">
          {students.map(student => (
            <div
              key={student._id}
              className={`p-2 rounded cursor-pointer hover:bg-gray-100 relative ${
                selectedStudent?._id === student._id ? 'bg-blue-100' : ''
              }`}
              onClick={() => setSelectedStudent(student)}
            >
              <div className="font-medium">{student.name}</div>
              <div className="text-sm text-gray-600">{student.regNumber}</div>
              {student.messageCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {student.messageCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Chat header */}
            <div className="border-b p-4 flex items-center">
              <div>
                <h3 className="font-bold">{selectedStudent.name}</h3>
                <div className="text-sm text-gray-600">
                  {selectedStudent.regNumber}
                  {studentInfo && ` • ${studentInfo.program}`}
                  {selectedStudent.messageCount > 0 && (
                    <span className="ml-2 text-blue-500">
                      {selectedStudent.messageCount} messages
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Student info */}
            {studentInfo && (
              <div className="border-b p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Program: {studentInfo.program}</div>
                  <div>Registration: {studentInfo.regNumber}</div>
                  <div className="col-span-2">
                    Courses: {studentInfo.courses?.map(c => c.name).join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Messages with improved date handling */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`mb-4 ${
                    message.from === user._id ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className={`inline-block p-3 rounded-lg ${
                    message.from === user._id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    <div>{message.content}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {/* Use timestamp if available, fallback to createdAt */}
                      {formatMessageDate(message.timestamp || message.createdAt)}
                      {message.from === user._id && (
                        <span className="ml-2">
                          {message.delivered ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                  {message.from !== user._id && (
                    <div className="text-xs mt-1">
                      From: {message.fromName} ({message.fromRegNumber})
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border p-2 rounded-l-lg"
                />
                <button
                  type="submit"
                  className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg ${
                    !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">
              {students.length > 0 
                ? "Select a student to view messages"
                : "No student messages yet"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}