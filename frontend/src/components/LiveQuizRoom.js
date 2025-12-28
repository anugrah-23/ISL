// frontend/src/components/LiveQuizRoom.js
import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "../socket";
import { useAuth } from "../context/authcontext";
import { useNavigate } from "react-router-dom";

// Scheduled live quiz key (must exist in backend)
const LIVE_GAME_KEY = "isl_daily";

export default function LiveQuizRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const questionTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const [status, setStatus] = useState("waiting"); // waiting | running | finished
  const [secondsLeft, setSecondsLeft] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answeredIndices, setAnsweredIndices] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);

  // -----------------------------
  // Helpers
  // -----------------------------
  function formatHHMMSS(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  }

  // -----------------------------
  // Socket setup
  // -----------------------------
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const joinLive = () => {
      socket.emit("live:join", { user });
      socket.emit("games:join", {
        gameKey: LIVE_GAME_KEY,
        user,
      });
    };

    if (socket.connected) joinLive();
    socket.on("connect", joinLive);

    // -----------------------------
    // Live countdown status
    // -----------------------------
    socket.on("live:status", ({ running, startsAt, serverTime }) => {
      if (running) {
        setStatus("running");
        setSecondsLeft(null);
        return;
      }

      setStatus("waiting");

      const offset = Date.now() - serverTime;
      const secs = Math.max(
        0,
        Math.floor((startsAt - Date.now() + offset) / 1000)
      );

      setSecondsLeft(secs);
    });

    // -----------------------------
    // Game lifecycle
    // -----------------------------
    socket.on("games:started", () => {
      setStatus("running");
      setSecondsLeft(null);
    });

    socket.on("games:question", ({ idx, statement, options, endsAt }) => {
      setCurrentQuestion({ idx, statement, options });
      setSelectedIndex(null);

      const secs = Math.max(
        0,
        Math.floor((endsAt - Date.now()) / 1000)
      );
      setTimeLeft(secs);

      if (questionTimerRef.current)
        clearInterval(questionTimerRef.current);

      questionTimerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(questionTimerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    });

    socket.on("games:leaderboard", ({ leaderboard }) => {
      setLeaderboard(leaderboard || []);
    });

    socket.on("games:finished", ({ leaderboard }) => {
      setStatus("finished");
      setLeaderboard(leaderboard || []);
      if (questionTimerRef.current)
        clearInterval(questionTimerRef.current);
    });

    socket.on("games:answer-received", ({ questionIdx }) => {
      setAnsweredIndices((prev) => ({
        ...prev,
        [questionIdx]: true,
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("live:status");
      socket.off("games:started");
      socket.off("games:question");
      socket.off("games:leaderboard");
      socket.off("games:finished");
      socket.off("games:answer-received");

      if (questionTimerRef.current)
        clearInterval(questionTimerRef.current);
      if (countdownTimerRef.current)
        clearInterval(countdownTimerRef.current);
    };
  }, [user, navigate]);

  // -----------------------------
  // Countdown ticking
  // -----------------------------
  useEffect(() => {
    if (secondsLeft === null) return;

    if (countdownTimerRef.current)
      clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(countdownTimerRef.current);
  }, [secondsLeft]);

  // -----------------------------
  // Submit answer
  // -----------------------------
  function submitAnswer() {
    if (!currentQuestion || selectedIndex === null) return;

    setAnsweredIndices((prev) => ({
      ...prev,
      [currentQuestion.idx]: selectedIndex,
    }));

    socketRef.current.emit("games:answer", {
      gameKey: LIVE_GAME_KEY,
      user,
      questionIdx: currentQuestion.idx,
      selectedIndex,
    });
  }

  if (!user) return null;

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold">Live Quiz</h2>

      {/* Countdown screen */}
      {status === "waiting" && secondsLeft !== null && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg text-gray-500 mb-2">
              Live quiz starts in
            </div>
            <div className="text-7xl font-bold text-indigo-600">
              {formatHHMMSS(secondsLeft)}
            </div>
            <div className="mt-3 text-sm text-gray-400">
              Daily at 7:00 PM
            </div>
          </div>
        </div>
      )}

      {/* Question view */}
      {currentQuestion && (
        <div className="mt-6">
          <div className="text-sm text-gray-500">
            Question {currentQuestion.idx + 1}
          </div>

          <div className="mt-2 p-4 border rounded bg-white">
            <div className="font-medium mb-3">
              {currentQuestion.statement}
            </div>

            <div className="mb-3 text-sm text-gray-500">
              Time left: {timeLeft}s
            </div>

            {currentQuestion.options.map((opt, i) => {
              const disabled =
                answeredIndices[currentQuestion.idx] !== undefined;
              const picked =
                selectedIndex === i ||
                answeredIndices[currentQuestion.idx] === i;

              return (
                <button
                  key={i}
                  onClick={() => !disabled && setSelectedIndex(i)}
                  className={`block w-full text-left p-3 mb-2 rounded border ${
                    picked ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  {opt}
                </button>
              );
            })}

            <div className="mt-3">
              <button
                onClick={submitAnswer}
                disabled={
                  answeredIndices[currentQuestion.idx] !== undefined
                }
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="mt-6">
        <h3 className="font-medium">Leaderboard</h3>
        <ol className="mt-2">
          {leaderboard.map((p, i) => (
            <li key={p.userId}>
              {i + 1}. {p.userId} — {p.score}
            </li>
          ))}
        </ol>
      </div>

      {status === "finished" && (
        <div className="mt-6 p-4 bg-green-50 rounded">
          <div className="font-medium">
            Quiz finished — see you tomorrow at 7:00 PM!
          </div>
        </div>
      )}
    </div>
  );
}
