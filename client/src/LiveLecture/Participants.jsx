import React from "react";

const ParticipantsList = ({ participants }) => {
  return (
    <div className="fixed top-4 right-4 w-64 bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="font-bold mb-4">Participants</h3>
      <ul>
        {participants.map((participant, index) => (
          <li key={index} className="mb-2">
            <span className="text-sm">{participant.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantsList;