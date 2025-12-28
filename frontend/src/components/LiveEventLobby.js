import React, { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";

export default function LiveEventLobby() {
  const socket = getSocket();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    socket.emit("live:join", { user });

    socket.on("live:status", ({ running, startsAt, serverTime }) => {
      if (running) {
        navigate("/live/event", { replace: true });
        return;
      }
      const offset = Date.now() - serverTime;
      const s = Math.max(
        0,
        Math.floor((startsAt - Date.now() + offset) / 1000)
      );
      setSecondsLeft(s);
    });

    socket.on("live:start", () => {
      navigate("/live/event", { replace: true });
    });

    return () => {
      socket.off("live:status");
      socket.off("live:start");
    };
  }, [navigate, socket, user]);

  useEffect(() => {
    if (secondsLeft === null) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  if (secondsLeft === null) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <motion.div
        key={secondsLeft}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="text-xl mb-4 text-gray-300">
          Live game starts in
        </div>
        <div className="text-7xl font-bold">{secondsLeft}</div>
      </motion.div>
    </div>
  );
}
