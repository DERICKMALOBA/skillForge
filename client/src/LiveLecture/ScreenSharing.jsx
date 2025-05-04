import React from "react";
import { FaDesktop } from "react-icons/fa";

const ScreenSharing = ({
  onStartScreenShare,
  onStopScreenShare,
  isSharing,
  isLoading = false,
  error = null,
  isPresenting = false,
}) => {
  const handleClick = () => {
    if (isLoading) return;
    isSharing ? onStopScreenShare() : onStartScreenShare();
  };

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={isLoading || isPresenting}
        className={`p-3 rounded-full transition-all ${
          isSharing
            ? "bg-green-900 hover:bg-green-800"
            : "bg-gray-700 hover:bg-gray-600"
        } ${isLoading || isPresenting ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={isSharing ? "Stop screen sharing" : "Start screen sharing"}
        aria-pressed={isSharing}
      >
        <FaDesktop
          className={`${isSharing ? "text-green-400" : ""} ${
            isLoading ? "animate-pulse" : ""
          }`}
        />
      </button>
      {error && (
        <span className="absolute -bottom-6 text-xs text-red-500 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
};

export default React.memo(ScreenSharing);