// frontend/src/components/DuelRoom.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket } from "../socket";
import { useAuth } from "../context/authcontext";
import { motion, AnimatePresence } from "framer-motion";

/**
 * DuelRoom.js
 * Final battle/duel room UI
 *
 * Behavior:
 * - Shows opponent name
 * - Smooth time bar spanning question card (green -> yellow -> orange -> red)
 * - Choose options until reveal; after reveal highlight correct / incorrect
 * - Forfeit modal + intercepting back/navigation to confirm forfeit
 * - Emits window events 'duel:started' and 'duel:ended' for navbar to listen
 */

export default function DuelRoom() {
  const { matchKey: paramMatchKey, matchId: paramMatchId } = useParams();
  const matchId = paramMatchKey || paramMatchId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const tickRef = useRef(null);

  // UI state
  const [opponent, setOpponent] = useState(null);
  const [question, setQuestion] = useState(null); // { idx, statement, options, endsAt, totalMs }
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(1);
  const [matchEnded, setMatchEnded] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [opponentAnsweredPulse, setOpponentAnsweredPulse] = useState(false);
  const [joiningError, setJoiningError] = useState(null);

  // helpers
  function safeClearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  // -----------------------
  // Socket setup
  // -----------------------
  useEffect(() => {
    const sock = getSocket();
    socketRef.current = sock;

    function onOpponent(payload = {}) {
      if (payload.opponent) {
        setOpponent(payload.opponent);
      } else if (payload.user) {
        setOpponent(payload.user);
      }
    }

    function onUserJoined(payload = {}) {
      const u = payload.user || payload;
      if (u && String(u.userId || u.id) !== String(user?.id)) {
        setOpponent(u);
      }
    }

    function onQuestion(payload = {}) {
      if (!payload) return;
      const now = Date.now();
      const endsAt = payload.endsAt || (now + (payload.durationSeconds ? payload.durationSeconds * 1000 : 10000));
      const totalMs = Math.max(100, endsAt - now);

      setQuestion({
        idx: payload.idx,
        statement: payload.statement,
        options: payload.options || [],
        endsAt,
        totalMs,
      });

      // reset selection state for new question
      setSelectedIndex(null);
      setCorrectIndex(null);
      setRevealed(false);

      // announce match active (useful for navbar)
      try {
        window.dispatchEvent(new CustomEvent("duel:started", { detail: { matchId } }));
      } catch (err) {
        // fallback: log
        console.warn("duel:started dispatch failed", err);
      }
    }

    function onPlayerAnswered(payload = {}) {
      const uid = payload.userId || payload.user?.id;
      if (!uid) return;
      if (String(uid) !== String(user?.id)) {
        setOpponentAnsweredPulse(true);
        setTimeout(() => setOpponentAnsweredPulse(false), 700);
      }
    }

    function onReveal(payload = {}) {
      // reveal correct/wrong
      safeClearTick();
      setRevealed(true);
      if (typeof payload.correctIndex === "number") {
        setCorrectIndex(payload.correctIndex);
      } else if (typeof payload.correct === "number") {
        setCorrectIndex(payload.correct);
      }
      // update scores if included (not shown in UI during match)
      if (payload.scores) {
        setMatchResult((prev) => ({ ...(prev || {}), scores: payload.scores }));
      }
    }

    function onMatchEnd(payload = {}) {
      safeClearTick();
      setMatchEnded(true);
      setMatchResult(payload.result || payload || {});
      setShowForfeitModal(false); // ✅ FORCE-CLOSE MODAL

      try {
        window.dispatchEvent(
          new CustomEvent("duel:ended", {
            detail: { matchId, result: payload.result || payload },
          })
        );
      } catch (err) {
        console.warn("duel:ended dispatch failed", err);
      }
    }


    // socket listeners
    try {
      sock.on("duel:opponent", onOpponent);
      sock.on("duel:user-joined", onUserJoined);
      sock.on("duel:question", onQuestion);
      sock.on("duel:player-answered", onPlayerAnswered);
      sock.on("duel:reveal", onReveal);
      sock.on("duel:match-end", onMatchEnd);
    } catch (err) {
      console.warn("socket.on failed", err);
    }

    // join the match room
    try {
      sock.emit("duel:join-room", { matchKey: matchId, matchId, user: { id: user?.id, name: user?.name } });
    } catch (err) {
      console.warn("duel:join-room emit failed", err);
      setJoiningError("Socket join failed");
    }

    return () => {
      safeClearTick();
      try {
        sock.off("duel:opponent", onOpponent);
        sock.off("duel:user-joined", onUserJoined);
        sock.off("duel:question", onQuestion);
        sock.off("duel:player-answered", onPlayerAnswered);
        sock.off("duel:reveal", onReveal);
        sock.off("duel:match-end", onMatchEnd);
      } catch (err) {
        console.warn("error removing socket listeners", err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user && user.id]);

  // -----------------------
  // Timer effect — smooth progress & timeLeft
  // -----------------------
  useEffect(() => {
    safeClearTick();
    if (!question) {
      setTimeLeft(0);
      setProgress(1);
      return;
    }

    function tick() {
      const now = Date.now();
      const remainingMs = Math.max(0, (question.endsAt || 0) - now);
      const frac = Math.max(0, Math.min(1, remainingMs / (question.totalMs || 1)));
      setProgress(frac);
      setTimeLeft(Math.ceil(remainingMs / 1000));
      if (remainingMs <= 0) {
        safeClearTick();
      }
    }

    tick();
    tickRef.current = setInterval(tick, 100);

    return () => {
      safeClearTick();
    };
  }, [question]);

  // -----------------------
  // Choose option (allowed until reveal)
  // -----------------------
  function chooseOption(i) {
    if (!question || revealed || matchEnded) return;
    setSelectedIndex(i);
    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit("duel:answer", {
          matchKey: matchId,
          matchId,
          user: { id: user?.id, name: user?.name },
          selectedIndex: i,
        });
      }
    } catch (err) {
      console.warn("duel:answer emit failed", err);
    }
  }

  // -----------------------
  // Forfeit flows
  // -----------------------
  function doForfeitAndLeave() {
    try {
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit("duel:forfeit", { matchKey: matchId, matchId, userId: user?.id });
      }
    } catch (err) {
      console.warn("duel:forfeit emit failed", err);
    } finally {
      navigate("/", { replace: true });
    }
  }

  function confirmForfeit() {
    setShowForfeitModal(false);
    doForfeitAndLeave();
  }

  // -----------------------
  // Intercept back/popstate and beforeunload
  // -----------------------
  useEffect(() => {
    if (matchEnded) return undefined;

    try {
      window.history.pushState({ duelGuard: true }, "");
    } catch (err) {
      console.warn("pushState failed", err);
    }

    const onPop = () => {
      if (matchEnded) return;
      const leave = window.confirm("Leave match? This will forfeit the match and you will lose. Do you want to leave?");
      if (leave) {
        doForfeitAndLeave();
      } else {
        try {
          window.history.pushState({ duelGuard: true }, "");
        } catch (err) {
          console.warn("pushState on cancel failed", err);
        }
      }
    };

    const onBeforeUnload = (e) => {
      if (matchEnded) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [matchEnded]);

  // -----------------------
  // Time bar color interpolation
  // -----------------------
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
  }
  function rgbToHex({ r, g, b }) {
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function lerpColor(hexA, hexB, t) {
    const A = hexToRgb(hexA);
    const B = hexToRgb(hexB);
    return rgbToHex({ r: lerp(A.r, B.r, t), g: lerp(A.g, B.g, t), b: lerp(A.b, B.b, t) });
  }

  const STOP_GREEN = "#10b981";
  const STOP_YELLOW = "#f59e0b";
  const STOP_ORANGE = "#f97316";
  const STOP_RED = "#ef4444";

  const barColor = useMemo(() => {
    const p = Math.max(0, Math.min(1, progress));
    const t = 1 - p; // 0 => full time, 1 => exhausted
    if (t <= 0.333333) {
      const local = t / 0.333333;
      return lerpColor(STOP_GREEN, STOP_YELLOW, local);
    } else if (t <= 0.666666) {
      const local = (t - 0.333333) / 0.333333;
      return lerpColor(STOP_YELLOW, STOP_ORANGE, local);
    }
    const local = (t - 0.666666) / 0.333333;
    return lerpColor(STOP_ORANGE, STOP_RED, local);
  }, [progress]);

  // -----------------------
  // Render helpers
  // -----------------------
  const optionTap = { scale: 0.98 };
  const optionHover = { y: -4 };

  function renderOptions() {
    if (!question) return null;
    return (
      <div className="space-y-3">
        {question.options.map((opt, i) => {
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
              onKeyDown={(e) => {
                if (e.key === "Enter") chooseOption(i);
              }}
              initial={false}
              whileTap={optionTap}
              whileHover={!revealed ? optionHover : undefined}
              className={`${base} ${revealBg} ${border} cursor-pointer`}
              style={{ willChange: "transform, opacity" }}
              {...animateProps}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-900">{opt}</div>
                {!revealed && selectedIndex === i && (
                  <motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
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
        <motion.div className="absolute inset-0 bg-black/50" onClick={() => setShowForfeitModal(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="bg-white rounded-lg p-6 w-full max-w-sm z-50 relative shadow-lg"
          role="dialog"
          aria-modal="true"
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
        >
          <h3 className="text-lg font-semibold mb-2">Forfeit match?</h3>
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to forfeit? This will end the match and you will lose.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForfeitModal(false)} className="px-4 py-2 border rounded bg-white">
              Cancel
            </button>
            <button onClick={() => confirmForfeit()} className="px-4 py-2 bg-red-600 text-white rounded">
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
        <motion.div className="mt-6 p-6 bg-white rounded shadow text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
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
      const youWon = winner && String(winner) === String(user?.id);
      return (
        <motion.div className="mt-6 p-6 bg-white rounded shadow text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <h2 className="text-2xl font-bold">{youWon ? "You Won!" : winner === "tie" ? "It's a tie!" : "You Lost"}</h2>
          <div className="mt-4">
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-indigo-600 text-white rounded">Return Home</button>
          </div>
        </motion.div>
      );
    }
    return null;
  }

  // -----------------------
  // Render main
  // -----------------------
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

          <div className="flex items-center gap-3">
            {!matchEnded && (
              <button
                onClick={() => setShowForfeitModal(true)}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >
                Forfeit
              </button>
            )}
        </div>
        </div>

        <div className="mt-3 text-sm text-gray-700 flex items-center justify-between">
          <div>Opponent: <span className="font-medium">{opponent ? opponent.name : "Waiting..."}</span></div>
          <div className="text-xs text-gray-500">Time left: <span className="font-medium">{timeLeft}s</span></div>
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={question ? `q-${question.idx}` : "q-waiting"}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } }}
              exit={{ opacity: 0, y: -8, scale: 0.995, transition: { duration: 0.18, ease: "easeIn" } }}
              className="mt-3 p-4 border rounded bg-white shadow-sm"
            >
              <div className="mb-3">
                <div className="w-full rounded-full h-6 overflow-hidden border border-gray-200 bg-gray-200">
                  <motion.div
                    className="h-6"
                    initial={false}
                    animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: barColor }}
                    transition={{ ease: "linear", duration: 0.12 }}
                    style={{ minWidth: "2%" }}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">Time remaining</div>
              </div>

              <div className="text-lg font-medium my-3">{question ? question.statement : "Waiting for question..."}</div>

              {renderOptions()}

              <div className="mt-3 text-xs text-gray-500">
                {!question && !matchEnded ? "Waiting for question..." : ""}
                {question && !revealed && !matchEnded ? "You may change your selection until time runs out." : ""}
                {revealed && <span>Reveal: correct answer highlighted in green.</span>}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {renderEndScreen()}
        {renderForfeitModal()}

        {joiningError && <div className="mt-4 text-red-600">Error: {joiningError}</div>}
      </div>
    </div>
  );
}
