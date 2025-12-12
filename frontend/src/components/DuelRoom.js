// frontend/src/components/DuelRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket } from "../socket";
import { useAuth } from "../context/authcontext";
import { motion, AnimatePresence } from "framer-motion";

export default function DuelRoom() {
  const params = useParams();
  const matchKey = params.matchKey || params.matchId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // UI state
  const [opponent, setOpponent] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [opponentAnsweredPulse, setOpponentAnsweredPulse] = useState(false);

  function safeClearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onOpponent = ({ opponent: opp } = {}) => {
      if (opp) setOpponent(opp);
    };

    const onUserJoined = ({ user: u } = {}) => {
      if (!u) return;
      if (u.userId && u.userId !== user.id) setOpponent(u);
    };

    const onQuestion = (payload = {}) => {
      if (!payload) return;
      // animate transition by replacing question state; AnimatePresence will animate
      setQuestion({ idx: payload.idx, statement: payload.statement, options: payload.options });
      setSelectedIndex(null);
      setCorrectIndex(null);
      setRevealed(false);

      // sync timer
      safeClearTimer();
      const tick = () => {
        const left = Math.max(0, Math.ceil((payload.endsAt - Date.now()) / 1000));
        setTimeLeft(left);
        if (left <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      tick();
      timerRef.current = setInterval(tick, 250);
    };

    const onPlayerAnswered = ({ userId } = {}) => {
      if (!userId) return;
      if (String(userId) !== String(user.id)) {
        // pulse opponent indicator briefly
        setOpponentAnsweredPulse(true);
        setTimeout(() => setOpponentAnsweredPulse(false), 700);
      }
    };

    const onReveal = ({ idx, correctIndex: ci, answers } = {}) => {
      safeClearTimer();
      setRevealed(true);
      setCorrectIndex(typeof ci === "number" ? ci : null);
    };

    const onMatchEnd = ({ result } = {}) => {
      safeClearTimer();
      setMatchEnded(true);
      setMatchResult(result || {});

      if (result && result.youForfeited) {
        setTimeout(() => navigate("/", { replace: true }), 150);
        return;
      }
    };

    socket.on("duel:opponent", onOpponent);
    socket.on("duel:user-joined", onUserJoined);
    socket.on("duel:question", onQuestion);
    socket.on("duel:player-answered", onPlayerAnswered);
    socket.on("duel:reveal", onReveal);
    socket.on("duel:match-end", onMatchEnd);

    try {
      socket.emit("duel:join-room", { matchKey, user });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("duel:join-room emit failed", e);
    }

    return () => {
      safeClearTimer();
      try {
        socket.off("duel:opponent", onOpponent);
        socket.off("duel:user-joined", onUserJoined);
        socket.off("duel:question", onQuestion);
        socket.off("duel:player-answered", onPlayerAnswered);
        socket.off("duel:reveal", onReveal);
        socket.off("duel:match-end", onMatchEnd);
      } catch (e) {
        /* ignore cleanup errors */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey, user && user.id, navigate]);

  // chooseOption allowed until reveal
  function chooseOption(i) {
    if (!question || revealed || matchEnded) return;
    setSelectedIndex(i);
    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit("duel:answer", { matchKey, matchId: matchKey, user: { id: user.id }, selectedIndex: i });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("duel:answer emit failed", e);
    }
  }

  // confirm forfeit: emit then redirect forfeiter immediately
  function confirmForfeit() {
    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit("duel:forfeit", { matchKey, matchId: matchKey, userId: user.id });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("duel:forfeit emit failed", e);
    } finally {
      navigate("/", { replace: true });
    }
  }

  // Motion variants
  const cardVariants = {
    initial: { opacity: 0, y: 12, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, scale: 0.995, transition: { duration: 0.18, ease: "easeIn" } },
  };

  const optionTap = { scale: 0.97 };
  const optionHover = { y: -4 };

  function renderOptions() {
    if (!question) return null;

    return (
      <div className="space-y-3">
        {question.options.map((opt, i) => {
          // decide styles for reveal / selection
          let base = "p-3 rounded border select-none ";
          let revealBg = "bg-white";
          let border = "border-gray-200";
          if (!revealed) {
            if (selectedIndex === i) {
              revealBg = "bg-blue-50";
              border = "border-blue-300";
            }
          } else {
            if (typeof correctIndex === "number" && i === correctIndex) {
              revealBg = "bg-green-100";
              border = "border-green-500";
            } else if (selectedIndex === i) {
              revealBg = "bg-red-100";
              border = "border-red-500";
            }
          }

          // motion style for reveal: correct pulses
          const animateProps = {};
          if (revealed && typeof correctIndex === "number" && i === correctIndex) {
            animateProps.animate = { scale: [1, 1.03, 1], transition: { duration: 0.45 } };
          } else if (revealed && selectedIndex === i && i !== correctIndex) {
            animateProps.animate = { opacity: [1, 0.9, 1], transition: { duration: 0.4 } };
          }

          return (
            <motion.div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => chooseOption(i)}
              onKeyDown={(e) => { if (e.key === "Enter") chooseOption(i); }}
              initial={false}
              whileTap={optionTap}
              whileHover={!revealed ? optionHover : undefined}
              className={`${base} ${revealBg} ${border} cursor-pointer`}
              style={{ willChange: "transform, opacity" }}
              {...animateProps}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-900">{opt}</div>
                {/* small badge when this option is currently selected (before reveal) */}
                {!revealed && selectedIndex === i && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                  >
                    Selected
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  function renderForfeitModal() {
    if (!showForfeitModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowForfeitModal(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="bg-white rounded-lg p-6 w-full max-w-sm z-50 relative"
          style={{ zIndex: 1000 }}
          role="dialog"
          aria-modal="true"
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          <h3 className="text-lg font-semibold mb-2">Forfeit match?</h3>
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to forfeit? This will end the match and you will lose.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForfeitModal(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              onClick={() => confirmForfeit()}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Yes, Forfeit
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  function renderEndScreen() {
    if (!matchEnded && !(matchResult && matchResult.forfeit)) return null;

    if (matchResult && matchResult.forfeit && !matchResult.youForfeited) {
      return (
        <motion.div
          className="mt-6 p-6 bg-white rounded shadow text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-2xl font-bold text-green-700">You WON — Opponent forfeited</h2>
          <p className="mt-2 text-sm text-gray-600">{matchResult.message || "Opponent forfeited."}</p>
          <div className="mt-4">
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-indigo-600 text-white rounded">Return Home</button>
          </div>
        </motion.div>
      );
    }

    if (matchEnded) {
      const winner = matchResult?.winner;
      const youWon = winner && String(winner) === String(user.id);
      return (
        <motion.div className="mt-6 p-6 bg-white rounded shadow text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}>
          <h2 className="text-2xl font-bold">{youWon ? "You Won!" : (winner === 'tie' ? "It's a tie!" : "You Lost")}</h2>
          <div className="mt-4">
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-indigo-600 text-white rounded">Return Home</button>
          </div>
        </motion.div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-3">
            Duel
            {opponentAnsweredPulse && (
              <motion.span
                className="inline-block w-2 h-2 rounded-full bg-yellow-400"
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.6 }}
                style={{ boxShadow: "0 0 6px rgba(250,180,60,0.6)" }}
              />
            )}
          </h2>

          <div>
            <button onClick={() => setShowForfeitModal(true)} className="px-3 py-2 bg-red-600 text-white rounded">Forfeit</button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-700 flex items-center justify-between">
          <div>
            Opponent: <span className="font-medium">{opponent ? opponent.name : "Waiting..."}</span>
          </div>
          <div className="text-xs text-gray-500">Time left: <span className="font-medium">{timeLeft}s</span></div>
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            {/* Animate presence of question card when question changes */}
            <motion.div
              key={question ? `q-${question.idx}` : "q-waiting"}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-3 p-4 border rounded bg-white shadow-sm"
            >
              <div className="text-lg font-medium mb-3">
                {question ? question.statement : "Waiting for question..."}
              </div>

              {renderOptions()}

              <div className="mt-3 text-xs text-gray-500">
                {!question && !matchEnded ? "Waiting for question..." : ""}
                {question && !revealed && !matchEnded ? "You may change your selection until time runs out." : ""}
                {revealed && <span>Reveal: correct answer highlighted in green.</span>}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* end screen (forfeit/win/loss) */}
        {renderEndScreen()}

        {renderForfeitModal()}
      </div>
    </div>
  );
}

// NOTE: motion variants declared outside component scope (keeps them stable)
const cardVariants = {
  initial: { opacity: 0, y: 12, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, scale: 0.995, transition: { duration: 0.18, ease: "easeIn" } },
};
