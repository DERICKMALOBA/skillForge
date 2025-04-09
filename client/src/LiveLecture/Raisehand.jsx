import React from "react";
import { FaHandPaper } from "react-icons/fa";

const RaiseHand = ({ raisedHand, handleRaiseHand }) => {
  return (
    <button onClick={handleRaiseHand} className="p-3 m-2 bg-gray-700 rounded-full">
      <FaHandPaper className={raisedHand ? "text-yellow-500" : ""} />
    </button>
  );
};

export default RaiseHand;