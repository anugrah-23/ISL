// sockets/friendMatch.js
module.exports = function initFriendMatch(io, socket, onlineUsers) {
  console.log("[friendMatch] bound", socket.id);

  // -------------------------
  // REGISTER PRESENCE
  // -------------------------
  socket.on("friend:register", ({ userId }) => {
    if (!userId) return;

    const uid = String(userId);
    socket.userId = uid;

    // send existing online users
    for (const [otherUserId] of onlineUsers.entries()) {
      socket.emit("friend:presence", {
        userId: otherUserId,
        online: true,
      });
    }

    // register self
    if (!onlineUsers.has(uid)) {
      onlineUsers.set(uid, new Set());

      socket.broadcast.emit("friend:presence", {
        userId: uid,
        online: true,
      });
    }

    onlineUsers.get(uid).add(socket.id);
  });

  // -------------------------
  // SEND DUEL INVITE
  // -------------------------
  socket.on("friend:invite", ({ toUserId }) => {
    const fromUserId = socket.userId;
    if (!fromUserId || !toUserId) return;

    const targets = onlineUsers.get(String(toUserId));
    if (!targets) return;

    for (const sid of targets) {
      io.to(sid).emit("friend:duel-invite", { fromUserId });
    }
  });

  // -------------------------
  // ACCEPT DUEL INVITE
  // -------------------------
  socket.on("friend:accept-invite", ({ fromUserId }) => {
    const toUserId = socket.userId;
    if (!fromUserId || !toUserId) return;

    const matchKey = `friend_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;

    const payload = { matchId: matchKey, matchKey };

    for (const sid of onlineUsers.get(String(fromUserId)) || []) {
      io.to(sid).emit("friend:match:created", payload);
    }
    for (const sid of onlineUsers.get(String(toUserId)) || []) {
      io.to(sid).emit("friend:match:created", payload);
    }
  });

  // -------------------------
  // DISCONNECT
  // -------------------------
  socket.on("disconnect", () => {
    const uid = socket.userId;
    if (!uid || !onlineUsers.has(uid)) return;

    const set = onlineUsers.get(uid);
    set.delete(socket.id);

    if (set.size === 0) {
      onlineUsers.delete(uid);
      io.emit("friend:presence", {
        userId: uid,
        online: false,
      });
    }
  });
};
