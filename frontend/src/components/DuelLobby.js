// frontend/src/components/DuelLobby.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import api from "../services/api";
import { getSocket } from "../socket";

/* ----------------------------------
   Friend Invite Modal
---------------------------------- */
function FriendInviteModal({ open, onClose, onConfirm }) {
  const [friend, setFriend] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="bg-white rounded-lg p-6 z-50 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Play with a friend</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your friend's username (exact).
        </p>

        <input
          value={friend}
          onChange={(e) => setFriend(e.target.value)}
          className="w-full p-3 border rounded mb-4"
          placeholder="friend's username"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>

          <button
            onClick={() => {
              if (!friend.trim()) return alert("Enter username");
              onConfirm(friend.trim());
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Invite & Join Queue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------
   Duel Lobby
---------------------------------- */
export default function DuelLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [duration, setDuration] = useState(1);
  const [mode, setMode] = useState("competitive");
  const [playWithFriend, setPlayWithFriend] = useState(false);
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  /* ----------------------------------
     Friend Duel Redirect (NO NEW LOGIC)
  ---------------------------------- */
  useEffect(() => {
    const socket = getSocket();

    const onFriendMatchCreated = ({ matchId, matchKey }) => {
      const mk = matchKey || matchId;
      if (!mk) return;
      navigate(`/duel/room/${encodeURIComponent(mk)}`);
    };

    socket.on("friend:match:created", onFriendMatchCreated);

    return () => {
      socket.off("friend:match:created", onFriendMatchCreated);
    };
  }, [navigate]);

  /* ----------------------------------
     Join Queue
  ---------------------------------- */
  async function joinQueue(friendUsername = null) {
    setErrorMsg(null);

    if (!user) {
      setErrorMsg("You must be signed in to join the queue.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: user.id,
        username: user.name || user.email || `user_${user.id}`,
        duration,
        mode,
        friendUsername: friendUsername || null,
      };

      const res = await api.post("/duel/join", payload);
      const { queueId, matched, match } = res.data;

      // socket subscribe
      try {
        const socket = getSocket();

        if (!socket.connected) {
          await new Promise((resolve) => {
            const onConnect = () => {
              socket.off("connect", onConnect);
              clearTimeout(timer);
              resolve();
            };

            const timer = setTimeout(() => {
              socket.off("connect", onConnect);
              resolve();
            }, 1500);

            socket.on("connect", onConnect);
          });
        }

        socket.emit("queue:subscribe", {
          queueId,
          settings: { duration, mode },
          userId: user.id,
          username: payload.username,
        });
      } catch (sockErr) {
        console.warn("[lobby] socket subscribe failed", sockErr);
      }

      // redirect
      if (matched && match?.matchKey) {
        navigate(`/duel/room/${encodeURIComponent(match.matchKey)}`);
      } else {
        navigate(`/duel/queue/${encodeURIComponent(queueId)}`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response && `Server returned ${err.response.status}`) ||
        err.message ||
        "Failed to join queue";

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Duel Lobby</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose match options, then join the queue.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <div className="text-sm text-gray-500 mb-2">Duration</div>
              <div className="flex gap-2">
                {[1, 5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded ${
                      duration === d
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <div className="text-sm text-gray-500 mb-2">Mode</div>
              <div className="flex gap-2">
                {["competitive", "friendly"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded ${
                      mode === m
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {m === "competitive" ? "Competitive" : "Friendly"}
                  </button>
                ))}
              </div>
            </div>

            {/* Friend */}
            <div>
              <div className="text-sm text-gray-500 mb-2">
                Play with friend
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="withFriend"
                  type="checkbox"
                  checked={playWithFriend}
                  onChange={() => setPlayWithFriend((v) => !v)}
                />
                <label htmlFor="withFriend" className="text-sm">
                  Invite specific friend
                </label>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() =>
                playWithFriend
                  ? setFriendModalOpen(true)
                  : joinQueue(null)
              }
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {loading ? "Joining…" : "Join Queue"}
            </button>

            <button
              onClick={() => {
                setDuration(1);
                setMode("competitive");
                setPlayWithFriend(false);
                setErrorMsg(null);
              }}
              className="px-4 py-2 border rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <FriendInviteModal
        open={friendModalOpen}
        onClose={() => setFriendModalOpen(false)}
        onConfirm={(friendUsername) => {
          setFriendModalOpen(false);
          joinQueue(friendUsername);
        }}
      />
    </div>
  );
}
