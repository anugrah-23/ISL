// backend/sockets/duel.js
//
// Full duel socket handler:
// - server-driven question timers & reveal delay
// - defensive payload handling (accepts user or userId shapes)
// - forfeit handling
// - queue subscribe/unsubscribe so REST matchmaker can emit to queue rooms
// - emits duel:opponent to each player's socket when match starts
// - no crash on malformed payloads
//
// Drop this file, restart the server.

module.exports = function initDuel(io) {
  const matches = {}; // matchId -> match state

  const QUESTION_TIME = 10;   // seconds per question (server authoritative)
  const REVEAL_MS = 2500;     // ms to show reveal before next question
  const TOTAL_QUESTIONS = 5;  // number of questions per match

  // Sample questions — replace with DB as needed
  const QUESTIONS = [
    { statement: "What is the sign for 'Hello'?", options: ["Wave hand", "Touch nose", "Cross arms", "Clap"], answerIndex: 0 },
    { statement: "Sign for 'Thank you' starts at:", options: ["Chin", "Shoulder", "Forehead", "Chest"], answerIndex: 0 },
    { statement: "Sign for 'Sorry' uses which hand motion?", options: ["Pat chest", "Wave", "Clap twice", "Point"], answerIndex: 0 },
    { statement: "Which is the sign for 'Yes'?", options: ["Nod", "Shake head", "Open palm", "Thumbs up"], answerIndex: 0 },
    { statement: "Which is the sign for 'No'?", options: ["Shake head", "Nod", "Wave", "Tap shoulder"], answerIndex: 0 },
  ];

  function ensureMatch(matchId) {
    if (!matches[matchId]) {
      matches[matchId] = {
        players: [],          // array { userId, name, socketId }
        scores: {},           // userId -> score
        currentQ: 0,
        answered: {},         // userId -> chosenIndex (mutable until scoring)
        timers: { questionTimer: null, revealTimer: null },
        status: 'waiting'     // 'waiting' | 'running' | 'ended'
      };
    }
    return matches[matchId];
  }

  function clearTimers(match) {
    try { if (match.timers.questionTimer) clearTimeout(match.timers.questionTimer); } catch (e) {}
    try { if (match.timers.revealTimer) clearTimeout(match.timers.revealTimer); } catch (e) {}
    match.timers.questionTimer = null;
    match.timers.revealTimer = null;
  }

  function findWinner(match) {
    const entries = Object.entries(match.scores || {});
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    if (entries.length >= 2 && entries[0][1] === entries[1][1]) return 'tie';
    return entries[0][0];
  }

  function startQuestion(matchId) {
    const match = matches[matchId];
    if (!match) return;
    if (match.status === 'ended' || match.players.length < 2) return;

    if (match.currentQ >= TOTAL_QUESTIONS) {
      const winner = findWinner(match);
      io.to(matchId).emit('duel:match-end', { result: { scores: match.scores, winner } });
      clearTimers(match);
      delete matches[matchId];
      return;
    }

    const qIndex = match.currentQ % QUESTIONS.length;
    const question = QUESTIONS[qIndex];
    match.answered = {};

    const endsAt = Date.now() + QUESTION_TIME * 1000;
    io.to(matchId).emit('duel:question', {
      idx: match.currentQ,
      statement: question.statement,
      options: question.options,
      endsAt
    });

    // schedule scoring
    if (match.timers.questionTimer) clearTimeout(match.timers.questionTimer);
    match.timers.questionTimer = setTimeout(() => {
      scoreRound(matchId);
    }, QUESTION_TIME * 1000 + 50);
  }

  function scoreRound(matchId) {
    const match = matches[matchId];
    if (!match) return;
    const question = QUESTIONS[match.currentQ % QUESTIONS.length];

    for (const p of match.players) {
      const chosen = match.answered[String(p.userId)];
      if (typeof chosen === 'number' && chosen === question.answerIndex) {
        match.scores[String(p.userId)] = (match.scores[String(p.userId)] || 0) + 1;
      } else {
        match.scores[String(p.userId)] = match.scores[String(p.userId)] || 0;
      }
    }

    io.to(matchId).emit('duel:reveal', {
      idx: match.currentQ,
      correctIndex: question.answerIndex,
      answers: { ...match.answered },
      scores: { ...match.scores }
    });

    if (match.timers.questionTimer) { clearTimeout(match.timers.questionTimer); match.timers.questionTimer = null; }

    match.currentQ++;

    // schedule next question or final match-end after reveal
    if (match.currentQ >= TOTAL_QUESTIONS) {
      if (match.timers.revealTimer) clearTimeout(match.timers.revealTimer);
      match.timers.revealTimer = setTimeout(() => {
        const winner = findWinner(match);
        io.to(matchId).emit('duel:match-end', { result: { scores: match.scores, winner } });
        clearTimers(match);
        delete matches[matchId];
      }, REVEAL_MS);
    } else {
      if (match.timers.revealTimer) clearTimeout(match.timers.revealTimer);
      match.timers.revealTimer = setTimeout(() => {
        match.timers.revealTimer = null;
        startQuestion(matchId);
      }, REVEAL_MS);
    }
  }

  // Main socket connection handler
  io.on('connection', (socket) => {
    console.log('[duel] socket connected:', socket.id);

    // queue subscribe/unsubscribe support for REST matchmaker
    socket.on('queue:subscribe', ({ queueId, settings, userId, username } = {}) => {
      try {
        if (!queueId) return;
        socket.join(queueId);
        socket.queueId = queueId;
        console.log(`[duel:socket] ${socket.id} subscribed to queue ${queueId}`, { settings, userId, username });
        socket.emit('queue:subscribed', { queueId });
      } catch (e) {
        console.warn('[duel:socket] queue:subscribe error', e);
      }
    });

    socket.on('queue:unsubscribe', ({ queueId } = {}) => {
      try {
        if (!queueId) return;
        socket.leave(queueId);
        if (socket.queueId === queueId) delete socket.queueId;
        console.log(`[duel:socket] ${socket.id} unsubscribed from queue ${queueId}`);
        socket.emit('queue:unsubscribed', { queueId });
      } catch (e) {
        console.warn('[duel:socket] queue:unsubscribe error', e);
      }
    });

    // join match room
    socket.on('duel:join-room', ({ matchKey, matchId, user } = {}) => {
      const id = matchId || matchKey || socket.matchId;
      if (!id) {
        console.warn('[duel] join-room missing match id/key');
        return;
      }

      try {
        if (socket.matchId !== id) {
          socket.join(id);
          socket.matchId = id;
        }
      } catch (e) {
        console.warn('[duel] join-room error', e);
      }

      const uid = user && (user.id || user.userId) ? (user.id || user.userId) : null;
      console.log(`[duel] socket ${socket.id} joined match room ${id} user=${uid || 'unknown'}`);

      const match = ensureMatch(id);

      // add or update player record
      if (uid) {
        const existing = match.players.find(p => String(p.userId) === String(uid));
        if (!existing) {
          match.players.push({ userId: String(uid), name: user.name || user.username || String(uid), socketId: socket.id });
          match.scores[String(uid)] = match.scores[String(uid)] || 0;
        } else {
          existing.socketId = socket.id;
        }
      } else {
        // placeholder player if no user id provided
        const placeholderId = `socket_${socket.id}`;
        if (!match.players.find(p => p.socketId === socket.id)) {
          match.players.push({ userId: placeholderId, name: `player_${placeholderId}`, socketId: socket.id });
          match.scores[placeholderId] = match.scores[placeholderId] || 0;
        }
      }

      // if two players are present and we are not yet running, start match
      if (match.players.length >= 2 && match.status !== 'running') {
        match.status = 'running';
        // keep only the first two (1v1)
        match.players = match.players.slice(0, 2);

        // emit opponent info individually so each client receives opponent details
        const p0 = match.players[0];
        const p1 = match.players[1];
        try {
          if (p0 && p0.socketId && p1) {
            io.to(p0.socketId).emit('duel:opponent', { opponent: { userId: p1.userId, name: p1.name } });
          }
          if (p1 && p1.socketId && p0) {
            io.to(p1.socketId).emit('duel:opponent', { opponent: { userId: p0.userId, name: p0.name } });
          }

          // optional: notify match starting
          io.to(id).emit('duel:match-starting', { matchId: id, players: match.players.map(p => ({ userId: p.userId, name: p.name })) });
        } catch (e) {
          console.warn('[duel] error emitting duel:opponent', e);
        }

        // start after brief settling delay
        setTimeout(() => {
          try { startQuestion(id); } catch (e) { console.error('[duel] startQuestion failed', e); }
        }, 300);
      }

      // notify legacy event
      io.to(id).emit('duel:user-joined', { user: { userId: uid, name: user?.name } });
    });

    // answer handler (defensive)
    socket.on('duel:answer', (payload = {}) => {
      try {
        const id = payload.matchId || payload.matchKey || socket.matchId;
        if (!id) {
          console.warn('[duel:answer] missing match id; ignoring payload', payload);
          return;
        }
        const match = matches[id];
        if (!match) {
          console.warn('[duel:answer] match not found', id);
          return;
        }

        const uid = (payload && payload.user && (payload.user.id || payload.user.userId)) || payload.userId || null;
        if (!uid) {
          console.warn('[duel:answer] missing user id in payload; ignoring', payload);
          return;
        }

        if (!match.answered) match.answered = {};
        match.answered[String(uid)] = payload.selectedIndex;

        socket.to(id).emit('duel:player-answered', { userId: uid });
      } catch (e) {
        console.error('[duel:answer] handler error', e);
      }
    });

    // forfeit handler
    // 🔒 IDEMPOTENT FORFEIT HANDLER — FINAL
    socket.on('duel:forfeit', ({ matchKey, matchId, userId } = {}) => {
      const id = matchId || matchKey || socket.matchId;
      if (!id) return;

      const match = matches[id];

      // ✅ Match already ended → ignore silently
      if (!match) return;

      // 🔒 HARD GUARD: prevent double-forfeit
      if (match.status === 'ended') return;

      match.status = 'ended';

      const uid = String(userId || socket.userId || '');
      const opponent = match.players.find(p => String(p.userId) !== uid);
      const winnerId = opponent ? opponent.userId : null;

      // Notify opponent
      socket.to(id).emit('duel:match-end', {
        result: {
          scores: match.scores,
          winner: winnerId,
          forfeit: true,
          message: 'Opponent forfeited',
        },
      });

      // Notify forfeiter
      socket.emit('duel:match-end', {
        result: {
          scores: match.scores,
          winner: winnerId,
          youForfeited: true,
          forfeit: true,
          message: 'You forfeited',
        },
      });

      clearTimers(match);
      delete matches[id];
    });


    // socket disconnect => treat as forfeit for remaining
    socket.on('disconnect', () => {
      console.log('[duel] socket disconnected:', socket.id);
      const id = socket.matchId;
      if (!id) {
        if (socket.queueId) {
          try { socket.leave(socket.queueId); } catch (e) {}
        }
        return;
      }

      const match = matches[id];
      if (!match) return;

      match.players = match.players.filter(p => p.socketId !== socket.id);

      if (match.players.length === 1) {
        const remaining = match.players[0];
        io.to(id).emit('duel:match-end', { result: { scores: match.scores, winner: remaining.userId, forfeit: true, message: 'Opponent disconnected' } });
        clearTimers(match);
        delete matches[id];
      } else if (match.players.length === 0) {
        clearTimers(match);
        delete matches[id];
      }
    });
  }); // end io.on('connection')
};
