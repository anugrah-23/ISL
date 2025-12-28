import React, { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useAuth } from "../context/authcontext";

export default function LiveEventRoom() {
  const socket = getSocket();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [eliminated, setEliminated] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    socket.on("live:question", (q) => {
      setQuestion(q);
    });

    socket.on("live:end", ({ leaderboard }) => {
      setLeaderboard(leaderboard);
    });

    return () => {
      socket.off("live:question");
      socket.off("live:end");
    };
  }, [socket]);

  const answer = (i) => {
    if (eliminated) return;
    socket.emit("live:answer", {
      userId: user.id,
      selectedIndex: i,
    });
  };

  if (leaderboard) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Top Players</h2>
        {leaderboard.map((p, i) => (
          <div key={p.id}>
            {i + 1}. {p.name} – {p.score}
          </div>
        ))}
      </div>
    );
  }

  if (!question) return <div className="p-8">Waiting for question…</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">{question.question}</h2>
      <div className="space-y-3">
        {question.options.map((o, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            disabled={eliminated}
            className="block w-full p-3 border rounded"
          >
            {o}
          </button>
        ))}
      </div>
      {eliminated && (
        <div className="mt-4 text-red-600">
          You are eliminated. Spectating…
        </div>
      )}
    </div>
  );
}
