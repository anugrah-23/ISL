// backend/sockets/battles.js
module.exports = function initBattles(io) {
  const rooms = {};

  io.on('connection', (socket) => {
    console.log('[socket] connected', socket.id);

    socket.on('battles:join', ({ roomId, user }) => {
      try {
        socket.join(roomId);
        rooms[roomId] = rooms[roomId] || { players: [], submissions: [] };
        rooms[roomId].players.push({ socketId: socket.id, user });
        io.to(roomId).emit('battles:user-joined', { user, socketId: socket.id });
      } catch (err) {
        console.error('battles:join error', err);
      }
    });

    socket.on('battles:submit', ({ roomId, clipKey, user }) => {
      try {
        rooms[roomId] = rooms[roomId] || { players: [], submissions: [] };
        rooms[roomId].submissions.push({ user, clipKey, socketId: socket.id, ts: Date.now() });
        io.to(roomId).emit('battles:submission', { user, clipKey });
      } catch (err) {
        console.error('battles:submit error', err);
      }
    });

    socket.on('battles:vote', ({ roomId, vote }) => {
      try {
        io.to(roomId).emit('battles:vote', vote);
      } catch (err) {
        console.error('battles:vote error', err);
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, r] of Object.entries(rooms)) {
        const before = r.players.length;
        r.players = r.players.filter(p => p.socketId !== socket.id);
        if (r.players.length !== before) io.to(roomId).emit('battles:user-left', { socketId: socket.id });
      }
    });
  });
};
