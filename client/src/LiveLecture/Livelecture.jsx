import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";
import ControlBar from "./Contolbar";
import Chat from "./Chat";
import ParticipantsList from "./Participants";

const socket = io("http://localhost:8000");

export default function LiveLecture() {
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
  const videoGridRef = useRef(null);
  const peerRef = useRef(null);
  const myVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const myAudioRef = useRef(null); // Audio Reference

  useEffect(() => {
    const myPeer = new Peer(uuidV4());
    peerRef.current = myPeer;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        setStream(userStream);

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = userStream;
        }

        if (myAudioRef.current) {
          myAudioRef.current.srcObject = userStream;
        }

        myPeer.on("call", (call) => {
          call.answer(userStream);
          const video = document.createElement("video");
          const audio = document.createElement("audio"); // Audio Element

          call.on("stream", (userStream) => {
            video.srcObject = userStream;
            video.play();
            videoGridRef.current.append(video);

            // Handle Audio
            audio.srcObject = userStream;
            audio.autoplay = true;
            document.body.appendChild(audio);
          });

          call.on("close", () => {
            video.remove();
            audio.remove(); // Remove audio on disconnect
          });
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      setParticipants((prev) => [...prev, { id: userId, name: `User ${userId}` }]);
    });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) peers[userId].close();
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    });

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const connectToNewUser = (userId, stream) => {
    if (!stream) return;
    const call = peerRef.current.call(userId, stream);
    const video = document.createElement("video");
    const audio = document.createElement("audio"); // Audio Element

    call.on("stream", (userStream) => {
      video.srcObject = userStream;
      video.play();
      videoGridRef.current.append(video);

      // Handle Audio
      audio.srcObject = userStream;
      audio.autoplay = true;
      document.body.appendChild(audio);
    });

    call.on("close", () => {
      video.remove();
      audio.remove(); // Remove audio on disconnect
    });

    setPeers((prev) => ({ ...prev, [userId]: call }));
  };

 

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micOn;
        setMicOn(!micOn);
        console.log("Mic is now", audioTracks[0].enabled ? "ON" : "OFF");
  
        // Ensure audio stops transmitting when mic is off
        Object.values(peers).forEach((peer) => {
          const senders = peer.peerConnection.getSenders();
          const audioSender = senders.find((sender) => sender.track?.kind === "audio");
          if (audioSender) {
            if (audioTracks[0].enabled) {
              audioSender.replaceTrack(audioTracks[0]); // Restore audio when mic is on
            } else {
              audioSender.replaceTrack(null); // Stop audio transmission when mic is off
            }
          }
        });
      } else {
        console.error("No audio track available!");
      }
    }
  };
  

  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoOn;
        setVideoOn(!videoOn);
      } else {
        console.error("No video track found!");
      }
    }
  };

  const handleRaiseHand = () => {
    setRaisedHand(!raisedHand);
    socket.emit("raise-hand", { userId: peerRef.current.id, raisedHand: !raisedHand });
  };

  const sendMessage = (message) => {
    socket.emit("chat-message", message);
    setMessages((prev) => [...prev, { user: "Me", text: message }]);
  };

  const openChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

      setScreenStream(screenStream);
      setIsSharingScreen(true);

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = screenStream;
      }

      Object.values(peers).forEach((peer) => {
        peer.peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
      });

      screenStream.getTracks()[0].onended = () => stopScreenShare();
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsSharingScreen(false);

      Object.values(peers).forEach((peer) => {
        peer.peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video" && stream) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      });

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
    }
  };
  

  
 
  

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div  className="flex-1 flex items-center justify-center gap-4 p-4" ref={videoGridRef}>
        <video ref={myVideoRef} autoPlay muted className="rounded-lg shadow-lg "></video>
        {isSharingScreen && (
          <video ref={screenVideoRef} autoPlay className="rounded-lg shadow-lg"></video>
        )}
      </div>
      <audio ref={myAudioRef} autoPlay controls className="hidden"></audio> {/* Hidden Audio */}
      <ControlBar
      myVideoRef={myVideoRef}
      elementRef={videoGridRef}
        micOn={micOn}
        videoOn={videoOn}
        raisedHand={raisedHand}
        isSharingScreen={isSharingScreen}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        handleRaiseHand={handleRaiseHand}
        openChat={openChat}
        onStartScreenShare={startScreenShare}
        onStopScreenShare={stopScreenShare}
        videoRef={isSharingScreen ? screenVideoRef : myVideoRef} // Pass the active video ref
      />
      {isChatOpen && <Chat messages={messages} sendMessage={sendMessage} />}
      <ParticipantsList participants={participants} />
    </div>
  );
}