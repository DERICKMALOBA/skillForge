import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaTimes } from "react-icons/fa";

const Chat = ({ messages, sendMessage, onClose, currentUser }) => {
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Combine server messages with local messages
  const allMessages = [...messages, ...localMessages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Create and display message immediately
    const newMessage = {
      text: message,
      user: currentUser.name,
      userId: currentUser.id,
      timestamp: new Date(),
      isOwn: true
    };

    // Add to local messages
    setLocalMessages(prev => [...prev, newMessage]);
    setMessage("");

    // Send to server
    sendMessage(message);
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-gray-800 rounded-lg shadow-xl flex flex-col z-40">
      {/* Chat Header */}
      <div className="flex justify-between items-center p-3 bg-gray-700 rounded-t-lg">
        <h3 className="font-bold">Lecture Chat</h3>
        <button 
          onClick={onClose}
          className="text-gray-300 hover:text-white"
          aria-label="Close chat"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-3 overflow-y-auto max-h-64">
        {allMessages.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No messages yet</p>
        ) : (
          allMessages.map((msg, i) => (
            <div 
              key={`${msg.timestamp}-${i}`} 
              className={`mb-3 ${msg.userId === currentUser.id ? 'text-right' : 'text-left'}`}
            >
              <div className={`inline-block px-3 py-2 rounded-lg ${
                msg.userId === currentUser.id ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                <span className="block text-xs font-semibold text-gray-300">
                  {msg.userId === currentUser.id ? "You" : msg.user}
                </span>
                <p className="text-white">{msg.text}</p>
                <span className="block text-xs text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 bg-gray-700 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
            placeholder="Type a message..."
            aria-label="Type your message"
          />
          <button 
            type="submit"
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg text-white"
            disabled={!message.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(Chat);