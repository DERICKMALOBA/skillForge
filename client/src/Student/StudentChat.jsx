import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import axios from "axios";

export default function StudentChat() {
  const user = useSelector((state) => state.user?.user); // Added safe access
  const [socket, setSocket] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize socket with stability enhancements
  useEffect(() => {
    if (!user?._id) return; // Ensure user exists and has _id

    const newSocket = io("http://localhost:8000", {
      withCredentials: true,
      auth: {
        userId: user._id,
        role: user.role,
        ...(user.role === 'student' && { 
          registrationNumber: user.registrationNumber 
        })
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ['websocket']
    });

    // Heartbeat handling
    newSocket.on('heartbeat', () => {
      newSocket.emit('heartbeat_ack');
    });

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log("Connected to chat server");
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log("Disconnected:", reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error("Connection error:", err);
      setError("Connection error - trying to reconnect...");
    });

    newSocket.on('private_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [user?._id]); // Only reconnect if user._id changes

  // Fetch lecturers
  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/hod/lecturers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setLecturers(response.data);
      } catch (err) {
        setError("Failed to load lecturers");
        console.error("Error fetching lecturers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLecturers();
  }, []);

  // Load chat history when lecturer is selected
  useEffect(() => {
    if (!socket || !selectedLecturer?._id) return; // Added null checks

    setLoading(true);
    socket.emit(
      "get_chat_history",
      { withUserId: selectedLecturer._id },
      (response) => {
        setLoading(false);
        if (response.status === "success") {
          setMessages(response.messages);
        } else {
          setError(response.message || "Failed to load chat history");
        }
      }
    );
  }, [socket, selectedLecturer?._id]); // Added null check

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message with error handling
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLecturer?._id || !socket) {
      setError("Please select a lecturer and enter a message");
      return;
    }

    socket.emit("private_message", 
      { 
        to: selectedLecturer._id,
        content: newMessage 
      },
      (response) => {
        if (response.status === "success") {
          setMessages(prev => [...prev, {
            _id: response.messageId,
            from: user._id,
            to: selectedLecturer._id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            fromName: user.name,
            fromRegNumber: user.registrationNumber,
            delivered: false
          }]);
          setNewMessage('');
          setError(null);
        } else {
          setError(response.message || "Failed to send message");
        }
      }
    );
  };

  if (!user) {
    return <div className="p-4 text-red-500">User not authenticated</div>;
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow">
      {/* Lecturers list */}
      <div className="w-1/4 border-r p-4 bg-gray-50">
        <h2 className="font-bold text-lg mb-4">Lecturers</h2>
        {loading ? (
          <div className="flex justify-center items-center h-3/4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-2">{error}</div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {lecturers.map((lecturer) => (
              <div
                key={lecturer._id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedLecturer?._id === lecturer._id
                    ? "bg-blue-100 border-blue-300"
                    : "bg-white hover:bg-gray-100 border-gray-200"
                } border`}
                onClick={() => setSelectedLecturer(lecturer)}
              >
                <div className="font-medium">
                  {lecturer.title} {lecturer.name}
                </div>
                <div className="text-sm text-gray-600">
                  {lecturer.department}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedLecturer ? (
          <>
            <div className="border-b p-4 flex items-center bg-white">
              <div className="flex items-center">
                <div className="bg-purple-100 text-purple-800 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  {selectedLecturer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">
                    {selectedLecturer.title} {selectedLecturer.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {selectedLecturer.department}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`} />
                <span className="text-sm">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div>No messages yet</div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id || message.timestamp} // Fallback to timestamp if no _id
                    className={`mb-4 flex ${
                      message.from === user._id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.from === user._id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}>
                      <div>{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.from === user._id ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                        {message.from === user._id && (
                          <span className="ml-2">
                            {message.delivered ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 p-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-r-lg ${
                    !isConnected || !newMessage.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white font-medium`}
                  disabled={!isConnected || !newMessage.trim()}
                >
                  Send
                </button>
              </div>
              {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-6">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                Select a lecturer
              </h3>
              <p className="text-gray-500">
                Choose a lecturer from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}