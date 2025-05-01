import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";
import ControlBar from "./Contolbar";
import Chat from "./Chat";
import ParticipantsList from "./Participants";
import AttendancePanel from "./AttendancePannel";
import PresentationRequestModal from "./PresentaionRequestModel";
import socket from './socket';
import { useSelector } from "react-redux";



export default function LiveLecture() {
  const { lectureId } = useParams();
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [raisedHand, setRaisedHand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isLecturer, setIsLecturer] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const videoGridRef = useRef(null);
  const peerRef = useRef(null);
  const myVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const myAudioRef = useRef(null);
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    // Initialize user role
    const userRole = localStorage.getItem("userRole");
    setIsLecturer(userRole === "lecturer");
    console.log(`${user.role} ${user.name} (${user.email}) joined lecture ${lectureId}`);
    // Initialize PeerJS
    const myPeer = new Peer(uuidV4());
    peerRef.current = myPeer;

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        setStream(userStream);
        if (myVideoRef.current) myVideoRef.current.srcObject = userStream;
        if (myAudioRef.current) myAudioRef.current.srcObject = userStream;

        // Handle incoming calls
        myPeer.on("call", (call) => {
          call.answer(userStream);
          const video = document.createElement("video");
          const audio = document.createElement("audio");

          call.on("stream", (userStream) => {
            video.srcObject = userStream;
            video.play();
            videoGridRef.current.append(video);

            audio.srcObject = userStream;
            audio.autoplay = true;
            document.body.appendChild(audio);
          });

          call.on("close", () => {
            video.remove();
            audio.remove();
          });
        });
      })
      .catch(console.error);

    // Socket event handlers
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

    socket.on("presentation-approved", () => {
      setIsPresenting(true);
    });

    socket.on("presentation-stopped", () => {
      setIsPresenting(false);
      if (isSharingScreen) stopScreenShare();
    });

    // Join or create lecture
    if (isLecturer && !lectureId) {
      const courseId = "course-id-from-url-or-state"; // You'll need to get this
      socket.emit("create-lecture", { courseId });
    } else if (lectureId) {
      socket.emit("join-lecture", { lectureId });
    }

    return () => {
      // Cleanup
      socket.off("user-connected");
      socket.off("user-disconnected");
      socket.off("attendance-update");
      socket.off("presentation-approved");
      socket.off("presentation-stopped");

      if (stream) stream.getTracks().forEach(track => track.stop());
      if (screenStream) screenStream.getTracks().forEach(track => track.stop());
    };
  }, [lectureId, isLecturer]);

  const connectToNewUser = (userId, stream) => {
    if (!stream) return;
    const call = peerRef.current.call(userId, stream);
    const video = document.createElement("video");
    const audio = document.createElement("audio");

    call.on("stream", (userStream) => {
      video.srcObject = userStream;
      video.play();
      videoGridRef.current.append(video);

      audio.srcObject = userStream;
      audio.autoplay = true;
      document.body.appendChild(audio);
    });

    call.on("close", () => {
      video.remove();
      audio.remove();
    });

    setPeers(prev => ({ ...prev, [userId]: call }));
  };

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micOn;
        setMicOn(!micOn);
        
        Object.values(peers).forEach(peer => {
          const senders = peer.peerConnection.getSenders();
          const audioSender = senders.find(s => s.track?.kind === "audio");
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

  const handleRaiseHand = () => {
    setRaisedHand(!raisedHand);
    socket.emit("raise-hand", { raisedHand: !raisedHand });
  };

  const requestPresentation = () => {
    setShowRequestModal(true);
  };

  const confirmPresentationRequest = () => {
    socket.emit("request-presentation", { lectureId });
    setShowRequestModal(false);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });

      setScreenStream(screenStream);
      setIsSharingScreen(true);

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = screenStream;
      }

      // Replace video track for all peers
      Object.values(peers).forEach(peer => {
        const senders = peer.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      screenStream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (error) {
      console.error("Screen share error:", error);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsSharingScreen(false);

      // Restore camera stream
      if (stream && myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        
        Object.values(peers).forEach(peer => {
          const senders = peer.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track?.kind === "video");
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      }
    }
  };

  const sendMessage = (message) => {
    socket.emit("chat-message", { 
      lectureId, 
      message,
      sender: localStorage.getItem("userName")
    });
    setMessages(prev => [...prev, { user: "Me", text: message }]);
  };

  const openChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header with attendance info */}
      <div className="bg-gray-800 p-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          {isLecturer ? "Hosting Live Lecture" : "Attending Live Lecture"}
        </h1>
        <div className="flex items-center space-x-4">
          <AttendancePanel count={attendanceCount} />
          {!isLecturer && !isPresenting && (
            <button 
              onClick={requestPresentation}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Request to Present
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4" ref={videoGridRef}>
        <video 
          ref={myVideoRef} 
          autoPlay 
          muted 
          className={`rounded-lg shadow-lg ${isPresenting ? "border-4 border-yellow-400" : ""}`}
        ></video>
        
        {isSharingScreen && (
          <video 
            ref={screenVideoRef} 
            autoPlay 
            className="rounded-lg shadow-lg border-4 border-green-400"
          ></video>
        )}
      </div>

      {/* Audio Element (hidden) */}
      <audio ref={myAudioRef} autoPlay controls className="hidden"></audio>

      {/* Control Bar */}
      <ControlBar
        micOn={micOn}
        videoOn={videoOn}
        raisedHand={raisedHand}
        isSharingScreen={isSharingScreen}
        isPresenting={isPresenting}
        isLecturer={isLecturer}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        handleRaiseHand={handleRaiseHand}
        openChat={openChat}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        onStopPresentation={() => socket.emit("stop-presentation", { lectureId })}
      />

      {/* Side Panels */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-4">
        {isChatOpen && (
          <Chat 
            messages={messages} 
            sendMessage={sendMessage} 
            onClose={() => setIsChatOpen(false)}
          />
        )}
        <div className="mt-3 pt-4">
        <ParticipantsList 
          participants={participants} 
          isLecturer={isLecturer}
          onApprovePresentation={(studentId) => 
            socket.emit("approve-presentation", { lectureId, studentId })
          }
        />
        </div>
      </div>

      {/* Presentation Request Modal */}
      {showRequestModal && (
        <PresentationRequestModal
          onConfirm={confirmPresentationRequest}
          onCancel={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
}