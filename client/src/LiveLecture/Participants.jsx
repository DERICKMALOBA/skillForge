import React, { memo } from "react";
import { FaHandPaper } from "react-icons/fa";

const ParticipantsList = ({ participants, raisedHands }) => {
  return (
    <div className="fixed top-16 right-4 z-50 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h3 className="font-bold text-white">
          Participants ({participants.length})
        </h3>
      </div>
      <ul className="max-h-[60vh] overflow-y-auto">
        {participants.map((participant) => (
          <li 
            key={participant.id} 
            className="px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="text-sm text-white">{participant.name}</span>
              {participant.isPresenting && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 rounded-full">
                  Presenting
                </span>
              )}
            </div>
            
            {raisedHands[participant.id] && (
              <FaHandPaper className="text-yellow-500 animate-bounce" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(ParticipantsList);