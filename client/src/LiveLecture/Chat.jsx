import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";

const Chat = ({ messages, sendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    sendMessage(message);
    setMessage("");
  };

  return (
    <div className="fixed bottom-16 right-4 w-80 h-96 bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-700 rounded-l-lg"
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage} className="p-2 bg-gray-700 rounded-r-lg">
          <FaCommentDots />
        </button>
      </div>
    </div>
  );
};

export default Chat;