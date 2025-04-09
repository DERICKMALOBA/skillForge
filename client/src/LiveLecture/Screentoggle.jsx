import React, { useState } from "react";
import { FaExpand, FaCompress } from "react-icons/fa";

const FullscreenToggle = ({ myVideoRef }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!myVideoRef || !myVideoRef.current) {
      console.error("Error: myVideoRef is not defined or is null");
      return;
    }

    if (!isFullscreen) {
      if (myVideoRef.current.requestFullscreen) {
        myVideoRef.current.requestFullscreen();
      } else if (myVideoRef.current.mozRequestFullScreen) {
        myVideoRef.current.mozRequestFullScreen();
      } else if (myVideoRef.current.webkitRequestFullscreen) {
        myVideoRef.current.webkitRequestFullscreen();
      } else if (myVideoRef.current.msRequestFullscreen) {
        myVideoRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <button onClick={toggleFullscreen} className="p-3 bg-gray-700 rounded-full">
      {isFullscreen ? <FaCompress /> : <FaExpand />}
    </button>
  );
};

export default FullscreenToggle;
