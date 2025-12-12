// frontend/src/components/DuelMatch.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function DuelMatch() {
  const { queueId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-2xl font-semibold">Match ready!</h2>
          <p className="text-gray-600 mt-3">Queue ID: {queueId}</p>

          <div className="mt-6">
            <p className="mb-3">(This is a placeholder match screen — implement duel UI here.)</p>
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded">Return Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}
