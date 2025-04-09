import React from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";

const VideoAudioControls = ({ micOn, videoOn, toggleMic, toggleVideo }) => {
  return (
    <div className="flex justify-center p-4 bg-gray-800">
      <button onClick={toggleMic} className="p-3 m-2 bg-gray-700 rounded-full">
        {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </button>
      <button onClick={toggleVideo} className="p-3 m-2 bg-gray-700 rounded-full">
        {videoOn ? <FaVideo /> : <FaVideoSlash />}
      </button>
    </div>
  );
};

export default VideoAudioControls;