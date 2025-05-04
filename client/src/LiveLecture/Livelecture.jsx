import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";
import { useSelector } from "react-redux";

import ControlBar from "./Contolbar";
import Chat from "./Chat";
import ParticipantsList from "./Participants";
import PresentationRequestModal from "./PresentaionRequestModel";

// Utils
import socket from "./socket";
import VideoGrid from "./VideoGrid";

const LiveLecture = () => {
  const { lectureId } = useParams();
  const user = useSelector((state) => state.user.user);
  const [presenterId, setPresenterId] = useState(null);
  const [, setIsScreenAvailable] = useState(false);
  // Components
  // State
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [raisedHands, setRaisedHands] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isLecturer, setIsLecturer] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [messages, setMessages] = useState([]);
  // Refs
  const peerRef = useRef(null);
  const myVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const myAudioRef = useRef(null);
  const videoGridRef = useRef(null);




  // Socket handler
useEffect(() => {
  socket.on('receive-chat-message', (message) => {
    setMessages(prev => [...prev, message]);
  });
  
  return () => socket.off('receive-chat-message');
}, []);

const sendMessage = (text) => {
  socket.emit('send-chat-message', { 
    lectureId, 
    message: text 
  });
};


  // Initialize lecture
  useEffect(() => {
    const initializeLecture = async () => {
      setIsLecturer(user.role === "lecturer");

      // Initialize PeerJS
      const myPeer = new Peer(uuidV4());
      peerRef.current = myPeer;

      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);

        // Setup peer connections
        setupPeerConnections(myPeer, userStream);

        // Connect to socket
        connectToSocket();

        // Set up video element
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = userStream;
        }
        if (myAudioRef.current) {
          myAudioRef.current.srcObject = userStream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeLecture();

    return cleanup;
  }, [lectureId, user.role]);

  const setupPeerConnections = (myPeer, userStream) => {
    // Handle incoming calls
    myPeer.on("call", (call) => {
      call.answer(userStream);
      const video = document.createElement("video");
      const audio = document.createElement("audio");

      call.on("stream", (userVideoStream) => {
        video.srcObject = userVideoStream;
        video.play();
        videoGridRef.current.append(video);

        audio.srcObject = userVideoStream;
        audio.autoplay = true;
        document.body.appendChild(audio);
      });

      call.on("close", () => {
        video.remove();
        audio.remove();
      });
    });
  };

  const connectToNewUser = (userId, stream) => {
    if (!stream) return;
    const call = peerRef.current.call(userId, stream);

    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      video.srcObject = userVideoStream;
      video.autoplay = true;
      video.className = "rounded-lg shadow-lg";
      videoGridRef.current.append(video);
    });

    call.on("close", () => {
      video.remove();
    });

    setPeers((prev) => ({ ...prev, [userId]: call }));

    // If this is the presenter connecting, send them our screen stream
    if (isSharingScreen && screenStream) {
      const senders = call.peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender) {
        videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
      }
    }
  };

  const connectToSocket = () => {
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      console.log(`Participant joined: ${user.name} (${user.email})`);
    });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
    });

    socket.on("attendance-update", ({ count, participants }) => {
      setAttendanceCount(count);
      setParticipants(participants);
    });

    socket.on("presentation-started", ({ userId }) => {
      setIsPresenting(true);
      setPresenterId(userId);
      if (userId === peerRef.current.id) {
        setIsScreenAvailable(true);
      }
    });

    socket.on("presentation-stopped", () => {
      setIsPresenting(false);
      setPresenterId(null);
      if (isSharingScreen) stopScreenShare();
    });

    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Join lecture
    if (lectureId) {
      socket.emit("join-lecture", { lectureId, user });
    }
  };

  const cleanup = () => {
    // Clean up media streams
    [stream, screenStream].forEach((s) => {
      if (s) s.getTracks().forEach((track) => track.stop());
    });

    // Clean up socket listeners
    socket.off("user-connected");
    socket.off("user-disconnected");
    socket.off("attendance-update");
    socket.off("presentation-approved");
    socket.off("presentation-stopped");
    socket.off("chat-message");
  };

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micOn;
        setMicOn(!micOn);

        Object.values(peers).forEach((peer) => {
          const senders = peer.peerConnection.getSenders();
          const audioSender = senders.find((s) => s.track?.kind === "audio");
          if (audioSender) {
            audioTracks[0].enabled
              ? audioSender.replaceTrack(audioTracks[0])
              : audioSender.replaceTrack(null);
          }
        });
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };
  socket.on("hand-raised", ({ userId, isRaised }) => {
    setRaisedHands((prev) => ({ ...prev, [userId]: isRaised }));
  });

  // Raise hand function
  const handleRaiseHand = () => {
    const newState = !raisedHands[user.id];
    socket.emit("raise-hand", {
      lectureId,
      userId: user.id,
      isRaised: newState,
    });
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(screenStream);
      setIsSharingScreen(true);
      socket.emit("start-presentation", { lectureId });

      // Replace video track for all peers
      Object.values(peers).forEach((peer) => {
        const senders = peer.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
        socket.emit("stop-presentation", { lectureId });
      };
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsSharingScreen(false);

      // Restore camera stream for all peers
      if (stream) {
        Object.values(peers).forEach((peer) => {
          const senders = peer.peerConnection.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      }
    }
  };

 

  const confirmPresentationRequest = () => {
    socket.emit("request-presentation", { lectureId });
    setShowRequestModal(false);
  };

  const approvePresentation = (studentId) => {
    socket.emit("approve-presentation", { lectureId, studentId });
  };

  const LectureHeader = ({ isLecturer, onRequestPresentation }) => (
    <div className="bg-gray-800 p-2 flex justify-between items-center">
      <h1 className="text-xl font-bold">
        {isLecturer ? "Hosting Live Lecture" : "Attending Live Lecture"}
      </h1>
      <div className="flex items-center space-x-4">
        {!isLecturer && !isPresenting && (
          <button
            onClick={onRequestPresentation}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Request to Present
          </button>
        )}
      </div>
    </div>
  );

  const SidePanels = ({
    isChatOpen,
    messages,
    sendMessage,
    participants,
    isLecturer,
    onApprovePresentation,
    
  }) => (
    <div className="absolute right-4 bottom-20 flex flex-col space-y-4">
      {isChatOpen && (
       <Chat 
       messages={messages}
       sendMessage={sendMessage}
       onClose={() => setIsChatOpen(false)}
     />
      )}
      <div className="mt-2">
        <ParticipantsList
          participants={participants}
          isLecturer={isLecturer}
          raisedHands={raisedHands}
          onApprovePresentation={onApprovePresentation}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <LectureHeader
        isLecturer={isLecturer}
        attendanceCount={attendanceCount}
        onRequestPresentation={() => setShowRequestModal(true)}
      />

      {/* Video Grid */}
      <VideoGrid
        myVideoRef={myVideoRef}
        screenVideoRef={screenVideoRef}
        isPresenting={isPresenting}
        isSharingScreen={isSharingScreen}
        peers={peers}
        presenterId={presenterId}
        isLecturer={isLecturer}
      />

      {/* Audio Element (hidden) */}
      <audio ref={myAudioRef} autoPlay controls className="hidden" />

      {/* Control Bar */}
      <ControlBar
        micOn={micOn}
        videoOn={videoOn}
      
        isSharingScreen={isSharingScreen}
        isPresenting={isPresenting}
        presenterId={presenterId}
        isLecturer={isLecturer}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        handleRaiseHand={handleRaiseHand}
        currentUserId={peerRef.current?.id}
        openChat={() => setIsChatOpen(!isChatOpen)}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onStopPresentation={() =>
          socket.emit("stop-presentation", { lectureId })
        }
        myVideoRef={myVideoRef}
      />

      {/* Side Panels */}
      <SidePanels
        isChatOpen={isChatOpen}
        messages={messages}
        sendMessage={sendMessage}
        participants={participants}
        isLecturer={isLecturer}
        onApprovePresentation={approvePresentation}
        onCloseChat={() => setIsChatOpen(false)}
      />

      {/* Modals */}
      {showRequestModal && (
        <PresentationRequestModal
          onConfirm={confirmPresentationRequest}
          onCancel={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
};

export default LiveLecture;
