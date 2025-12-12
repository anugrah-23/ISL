// frontend/src/components/DuelRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/authcontext";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET || window.location.origin.replace(/^http/, "ws");

export default function DuelRoom() {
  const { matchId } = useParams();   // ✅ Use matchId (backend sends matchId)
  const { user } = useAuth();

  const socketRef = useRef(null);
  const [opponent, setOpponent] = useState(null);
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [scores, setScores] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (!matchId || !user) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[duel] connected, joining room:", matchId);
      socket.emit("duel:join-room", { matchId, user });
    });

    // Opponent joined
    socket.on("duel:opponent", ({ opponent }) => {
      setOpponent(opponent?.name || opponent?.userId);
    });

    // Incoming question
    socket.on("duel:question", ({ idx, statement, options, time }) => {
      console.log("[duel] question:", statement);
      setQuestion({ idx, statement, options });

      setTimeLeft(time);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    });

    // Opponent answered (you can show UI highlight if needed)
    socket.on("duel:player-answered", ({ userId }) => {
      console.log("[duel] opponent answered:", userId);
    });

    // Match ends
    socket.on("duel:match-end", ({ result }) => {
      console.log("[duel] match ended");
      setScores(result.scores || {});
      if (timerRef.current) clearInterval(timerRef.current);
    });

    socket.on("connect_error", (err) =>
      console.warn("[duel] socket connect error:", err?.message || err)
    );

    return () => {
      socket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchId, user]);

  function submitAnswer(selectedIndex) {
    if (!question || !socketRef.current) return;

    socketRef.current.emit("duel:answer", {
      matchId,
      user,
      idx: question.idx,
      selectedIndex,
    });

    console.log("[duel] submitted answer:", selectedIndex);
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-xl">Duel Match: {matchId}</h3>

      <div className="mt-3 text-lg">
        Opponent:{" "}
        <span className="font-medium">{opponent || "Waiting..."}</span>
      </div>

      {/* QUESTION BLOCK */}
      {question ? (
        <div className="mt-6 p-4 border rounded bg-white shadow">
          <div className="font-medium text-lg">{question.statement}</div>

          <div className="mt-1 text-sm text-gray-600">
            Time left: {timeLeft}s
          </div>

          <div className="mt-4 space-y-2">
            {question.options.map((o, i) => (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                className="block w-full p-2 border rounded hover:bg-gray-50 text-left"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-gray-500">Waiting for question...</div>
      )}

      {/* SCORES */}
      <div className="mt-6">
        <h4 className="font-semibold text-lg">Scores</h4>
        <ul className="mt-2">
          {Object.entries(scores).map(([uid, sc]) => (
            <li key={uid} className="text-sm">
              {uid}: {sc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
