import React, { useEffect, useRef } from "react";

const VideoGrid = ({
  myVideoRef,
  screenVideoRef,
  isPresenting,
  isSharingScreen,
  peers,
  presenterId,
  isLecturer,
}) => {
  const videoGridRef = useRef(null);

  useEffect(() => {
    // Clean up any existing peer videos
    const videoGrid = videoGridRef.current;
    return () => {
      if (videoGrid) {
        Array.from(videoGrid.children)
          .filter(el => el.tagName === "VIDEO" && el !== myVideoRef.current && el !== screenVideoRef.current)
          .forEach(video => video.remove());
      }
    };
  }, []);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4" ref={videoGridRef}>
      {/* Local video */}
      <video 
        ref={myVideoRef} 
        autoPlay 
        muted 
        className={`rounded-lg shadow-lg ${
          isPresenting && presenterId === peerRef.current.id 
            ? "border-4 border-yellow-400" 
            : ""
        }`}
      />
      
      {/* Screen share video (for presenter) */}
      {isSharingScreen && (
        <video 
          ref={screenVideoRef} 
          autoPlay 
          className="rounded-lg shadow-lg border-4 border-green-400"
        />
      )}
      
      {/* Peer videos */}
      {Object.entries(peers).map(([userId, peer]) => (
        <video
          key={userId}
          ref={video => {
            if (video && peer.stream) {
              video.srcObject = peer.stream;
            }
          }}
          autoPlay
          className={`rounded-lg shadow-lg ${
            isPresenting && presenterId === userId 
              ? "border-4 border-yellow-400" 
              : ""
          }`}
        />
      ))}
    </div>
  );
};

export default React.memo(VideoGrid);