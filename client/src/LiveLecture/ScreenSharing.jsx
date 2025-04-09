import React from "react";
import { FaDesktop } from "react-icons/fa";

const ScreenSharing = ({ onStartScreenShare, onStopScreenShare, isSharing }) => {
  return (
    <button
      onClick={isSharing ? onStopScreenShare : onStartScreenShare}
      className="p-3 bg-gray-700 rounded-full"
    >
      <FaDesktop className={isSharing ? "text-green-500" : ""} />
    </button>
  );
};

export default ScreenSharing;