import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/authcontext";
import { getSocket } from "../socket";

export default function FriendsPage() {
  const { user } = useAuth();

  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [online, setOnline] = useState(new Set());
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(null);

  async function loadAll() {
    if (!user) return;
    const [f, p] = await Promise.all([
      api.get(`/friends/${user.id}`),
      api.get(`/friends/${user.id}/pending`),
    ]);
    setFriends(f.data || []);
    setPending(p.data || []);
  }

  useEffect(() => {
    if (!user) return;

    loadAll();

    const socket = getSocket();

    socket.on("friend:presence", ({ userId, online }) => {
      setOnline((prev) => {
        const copy = new Set(prev);
        online ? copy.add(String(userId)) : copy.delete(String(userId));
        return copy;
      });
    });

    return () => {
      socket.off("friend:presence");
    };
  }, [user]);

  async function addFriend() {
    if (!username.trim()) return;
    setStatus(null);
    try {
      const res = await api.post("/friends/add-by-username", {
        userId: user.id,
        username: username.trim(),
      });
      setStatus(`Request sent to ${res.data.friend.name}`);
      setUsername("");
    } catch (err) {
      setStatus(err?.response?.data?.message || "Failed");
    }
  }

  async function acceptRequest(fromUserId) {
    await api.post("/friends/accept", { userId: user.id, fromUserId });
    loadAll();
  }

  async function rejectRequest(fromUserId) {
    await api.post("/friends/reject", { userId: user.id, fromUserId });
    loadAll();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Friends</h2>

        {/* ADD FRIEND */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={addFriend}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Add
            </button>
          </div>
          {status && <div className="mt-2 text-sm">{status}</div>}
        </div>

        {/* PENDING */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Pending Requests</h3>
            {pending.map((p) => (
              <div
                key={p.from_user_id}
                className="flex justify-between items-center p-3 border rounded bg-yellow-50 mb-2"
              >
                <span>{p.from_username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(p.from_user_id)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(p.from_user_id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FRIEND LIST */}
        <div className="space-y-2">
          {friends.map((f) => {
            const isOnline = online.has(String(f.id));
            return (
              <div
                key={f.id}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span>{f.name}</span>
                </div>

                <button
                  disabled={!isOnline}
                  onClick={() =>
                    getSocket().emit("friend:invite", { toUserId: f.id })
                  }
                  className={`px-3 py-1 rounded text-white ${
                    isOnline
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Duel
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
