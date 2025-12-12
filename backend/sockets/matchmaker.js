// backend/sockets/matchmaker.js
const { randomUUID } = require('crypto');

module.exports = function attachMatchmaker(io) {
  const waiting = {}; // { settingsKey: [ { socketId, queueId, userId, username }, ... ] }
  const queueSubscriptions = new Map(); // queueId -> { settingsKey, socketId }

  function settingsKey(settings) {
    if (!settings || typeof settings !== 'object') return JSON.stringify({});
    const keyObj = { mode: String(settings.mode || 'competitive'), duration: Number(settings.duration || 1) };
    return JSON.stringify(keyObj);
  }

  function safeEmit(socketId, event, payload) {
    const s = io.sockets.sockets.get(socketId);
    if (s && s.connected) {
      s.emit(event, payload);
      console.debug(`[matchmaker] emitted '${event}' to ${socketId}`, payload && payload.matchId ? payload.matchId : '');
      return true;
    } else {
      console.warn(`[matchmaker] cannot emit '${event}' to ${socketId} — not connected`);
      return false;
    }
  }

  function subscribeSocket({ socketId, queueId, userId, username, settings }) {
    const key = settingsKey(settings);
    waiting[key] = waiting[key] || [];

    console.log(`[matchmaker] queue:subscribe: socket=${socketId} queueId=${queueId} key=${key} user=${username || userId}`);

    // If someone is waiting, match FIFO
    if (waiting[key].length > 0) {
      const partner = waiting[key].shift();
      if (partner && partner.queueId) queueSubscriptions.delete(partner.queueId);

      const matchId = randomUUID();
      const players = [
        { socketId: partner.socketId, queueId: partner.queueId, userId: partner.userId, username: partner.username },
        { socketId, queueId, userId, username },
      ];

      const payload = { matchId, queueId, players, settings: JSON.parse(key) };

      console.log(`[matchmaker] MATCH found: matchId=${matchId} players=[${partner.socketId}, ${socketId}] key=${key}`);
      safeEmit(partner.socketId, 'matched', payload);
      safeEmit(socketId, 'matched', payload);

      return { matched: true, matchId, players };
    }

    // otherwise enqueue
    waiting[key].push({ socketId, queueId, userId, username });
    queueSubscriptions.set(queueId, { settingsKey: key, socketId });

    console.log(`[matchmaker] queued: socket=${socketId} queueId=${queueId} key=${key} queueLength=${waiting[key].length}`);

    return { matched: false };
  }

  function unsubscribeQueue(queueId) {
    const meta = queueSubscriptions.get(queueId);
    if (!meta) return false;
    const { settingsKey } = meta;
    const arr = waiting[settingsKey] || [];
    waiting[settingsKey] = arr.filter((e) => e.queueId !== queueId);
    queueSubscriptions.delete(queueId);
    console.log(`[matchmaker] unsubscribed queueId=${queueId}`);
    return true;
  }

  function removeSocketSubscriptions(socketId) {
    for (const [queueId, meta] of queueSubscriptions.entries()) {
      if (meta.socketId === socketId) {
        unsubscribeQueue(queueId);
      }
    }
  }

  io.on('connection', (socket) => {
    console.debug('[matchmaker] socket connected', socket.id);

    socket.on('queue:subscribe', (payload) => {
      if (!payload || !payload.queueId) {
        console.warn('[matchmaker] queue:subscribe missing queueId from', socket.id);
        socket.emit('error', { message: 'queue:subscribe requires queueId' });
        return;
      }
      const { queueId, settings, userId, username } = payload;
      subscribeSocket({ socketId: socket.id, queueId, userId, username, settings });
    });

    socket.on('queue:unsubscribe', (payload) => {
      if (!payload || !payload.queueId) return;
      unsubscribeQueue(payload.queueId);
    });

    socket.on('disconnect', (reason) => {
      console.debug('[matchmaker] socket disconnected', socket.id, 'reason:', reason);
      removeSocketSubscriptions(socket.id);
    });
  });

  return {
    _waiting: waiting,
    _queueSubscriptions: queueSubscriptions,
    subscribeSocket,
    unsubscribeQueue,
  };
};
