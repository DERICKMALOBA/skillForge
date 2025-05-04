import React from "react";
import { FaHandPaper } from "react-icons/fa";

const RaiseHand = ({ isRaised, onRaiseHand }) => {
  return (
    <button 
      onClick={onRaiseHand}
      className={`p-3 rounded-full transition-colors ${
        isRaised ? "bg-yellow-500/20" : "bg-gray-700"
      }`}
      aria-label={isRaised ? "Lower hand" : "Raise hand"}
    >
      <FaHandPaper className={isRaised ? "text-yellow-500 animate-bounce" : ""} />
    </button>
  );
};

export default RaiseHand;