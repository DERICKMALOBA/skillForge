import React from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaHandPaper,
  FaCommentDots,
  FaDesktop,
} from "react-icons/fa";
import FullscreenToggle from "./Screentoggle";

const ControlBar = ({
  micOn,
  videoOn,
  raisedHand,
  isSharingScreen,
  toggleMic,
  toggleVideo,
  handleRaiseHand,
  openChat,
  onStartScreenShare,
  onStopScreenShare,
  myVideoRef, // ✅ Remove default value
}) => {
  return (
    <div className="flex justify-center p-4 bg-gray-800 space-x-4">
      <button onClick={toggleMic} className="p-3 bg-gray-700 rounded-full">
        {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </button>
      <button onClick={toggleVideo} className="p-3 bg-gray-700 rounded-full">
        {videoOn ? <FaVideo /> : <FaVideoSlash />}
      </button>
      <button onClick={handleRaiseHand} className="p-3 bg-gray-700 rounded-full">
        <FaHandPaper className={raisedHand ? "text-yellow-500" : ""} />
      </button>
      <button onClick={openChat} className="p-3 bg-gray-700 rounded-full">
        <FaCommentDots />
      </button>
      <button
        onClick={isSharingScreen ? onStopScreenShare : onStartScreenShare}
        className="p-3 bg-gray-700 rounded-full"
      >
        <FaDesktop className={isSharingScreen ? "text-green-500" : ""} />
      </button>
      <FullscreenToggle  myVideoRef={myVideoRef}/> {/* ✅ Pass videoGridRef */}
    </div>
  );
};

export default ControlBar;
