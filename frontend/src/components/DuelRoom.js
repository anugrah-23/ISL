// frontend/src/components/DuelRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getSocket } from "../socket";
import { useAuth } from "../context/authcontext";

export default function DuelRoom() {
  const { matchKey } = useParams();
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [opponent, setOpponent] = useState(null);
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [scores, setScores] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (!matchKey || !user) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Wait briefly for connection if needed
    const join = async () => {
      if (!socket.connected) {
        await new Promise((resolve) => {
          const onConnect = () => { socket.off('connect', onConnect); clearTimeout(t); resolve(); };
          const t = setTimeout(() => { socket.off('connect', onConnect); resolve(); }, 1500);
          socket.on('connect', onConnect);
        });
      }

      // join match room using matchKey (server accepts matchKey or matchId)
      socket.emit("duel:join-room", { matchKey, user });
      console.debug('[duel] emitted duel:join-room', matchKey, user?.id);
    };
    join();

    socket.on("duel:opponent", ({ opponent }) => {
      setOpponent(opponent?.name || opponent?.userId);
    });

    socket.on("duel:question", ({ idx, statement, options, time }) => {
      setQuestion({ idx, statement, options });
      setTimeLeft(time);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    });

    socket.on("duel:player-answered", ({ userId }) => {
      // optional: show indicator
      console.log('opponent answered', userId);
    });

    socket.on("duel:match-end", ({ result }) => {
      setScores(result.scores || {});
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off("duel:opponent");
      socket.off("duel:question");
      socket.off("duel:player-answered");
      socket.off("duel:match-end");
    };
  }, [matchKey, user]);

  function submitAnswer(optIdx) {
    if (!question || !socketRef.current) return;
    socketRef.current.emit("duel:answer", { matchKey, user, idx: question.idx, selectedIndex: optIdx });
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold">Duel Match</h2>
        <p className="text-gray-500">Match key: {matchKey}</p>

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>You:</strong> {user?.name || user?.email} <br />
          <strong>Opponent:</strong> {opponent || "Waiting..."}
        </div>

        {question ? (
          <div className="mt-5 p-4 border rounded">
            <h3 className="font-semibold text-lg">{question.statement}</h3>
            <div className="text-sm text-gray-600 mt-1">Time Left: {timeLeft}s</div>
            <div className="mt-3 space-y-2">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => submitAnswer(idx)}
                  className="block w-full text-left p-2 border rounded hover:bg-blue-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 text-gray-500">Waiting for question…</div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold">Scores</h3>
          <ul>
            {Object.entries(scores).map(([uid, sc]) => <li key={uid}>{uid}: {sc}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
