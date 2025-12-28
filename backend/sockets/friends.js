module.exports = function initFriendSockets(io) {
  // userId -> Set(socketId)
  const onlineUsers = new Map();

  function broadcastPresence(userId, online) {
    io.emit("friend:presence", { userId, online });
  }

  io.on("connection", (socket) => {
    // Register user for presence
    socket.on("friend:register", ({ userId }) => {
      if (!userId) return;

      socket.userId = String(userId);

      if (!onlineUsers.has(socket.userId)) {
        onlineUsers.set(socket.userId, new Set());
        broadcastPresence(socket.userId, true); // first connection
      }

      onlineUsers.get(socket.userId).add(socket.id);
    });

    socket.on("disconnect", () => {
      const userId = socket.userId;
      if (!userId || !onlineUsers.has(userId)) return;

      const set = onlineUsers.get(userId);
      set.delete(socket.id);

      if (set.size === 0) {
        onlineUsers.delete(userId);
        broadcastPresence(userId, false);
      }
    });
  });
};
