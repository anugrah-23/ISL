// backend/sockets/duel.js
module.exports = (io) => {
  const matches = {};  
  const QUESTION_TIME = 10;  // seconds per question
  const TOTAL_QUESTIONS = 5;

  // Sample questions (replace with ISL questions later)
  const QUESTIONS = [
    {
      statement: "What is the sign for 'Hello'?",
      options: ["Wave hand", "Touch nose", "Cross arms", "Clap"],
      answerIndex: 0
    },
    {
      statement: "Sign for 'Thank you' starts at:",
      options: ["Chin", "Shoulder", "Forehead", "Chest"],
      answerIndex: 0
    }
  ];

  io.on("connection", (socket) => {
    console.log("[duel] socket connected:", socket.id);

    // -------------------------
    // PLAYER JOINS MATCH ROOM
    // -------------------------
    socket.on("duel:join-room", ({ matchId, user }) => {
      socket.join(matchId);
      console.log(`[duel] ${user?.id} joined match ${matchId}`);

      // Create match room if needed
      if (!matches[matchId]) {
        matches[matchId] = {
          players: [],
          scores: {},
          currentQ: 0,
          answered: {},
        };
      }

      const match = matches[matchId];

      // Add player if not already added
      if (!match.players.find((p) => p.userId === user.id)) {
        match.players.push({ userId: user.id, name: user.name });
        match.scores[user.id] = 0;
      }

      // Identify opponent
      if (match.players.length === 2) {
        const opponent = match.players.find((p) => p.userId !== user.id);
        socket.emit("duel:opponent", { opponent });
        socket.to(matchId).emit("duel:opponent", { opponent: user });

        // Start duel if both joined
        startQuestion(io, matchId);
      }
    });

    // -------------------------
    // PLAYER ANSWERS QUESTION
    // -------------------------
    socket.on("duel:answer", ({ matchId, user, idx, selectedIndex }) => {
      const match = matches[matchId];
      if (!match) return;

      if (match.answered[user.id]) return; // ignore duplicates

      match.answered[user.id] = selectedIndex;

      // Notify opponent UI that this player has answered
      socket.to(matchId).emit("duel:player-answered", { userId: user.id });

      // If both players answered, evaluate immediately
      if (Object.keys(match.answered).length === match.players.length) {
        scoreRound(io, matchId);
      }
    });

    socket.on("disconnect", () => {
      console.log("[duel] socket disconnected:", socket.id);
    });
  });

  // --------------------------------------------------
  // SEND A QUESTION
  // --------------------------------------------------
  function startQuestion(io, matchId) {
    const match = matches[matchId];
    if (!match) return;

    if (match.currentQ >= TOTAL_QUESTIONS) {
      endMatch(io, matchId);
      return;
    }

    match.answered = {};
    const question = QUESTIONS[match.currentQ % QUESTIONS.length]; // loop sample questions

    io.to(matchId).emit("duel:question", {
      idx: match.currentQ,
      statement: question.statement,
      options: question.options,
      time: QUESTION_TIME,
    });

    console.log(`[duel] sending question ${match.currentQ} to ${matchId}`);

    // Auto-end question after time expires
    setTimeout(() => {
      scoreRound(io, matchId);
    }, QUESTION_TIME * 1000);
  }

  // --------------------------------------------------
  // SCORE ROUND
  // --------------------------------------------------
  function scoreRound(io, matchId) {
    const match = matches[matchId];
    if (!match) return;

    const question = QUESTIONS[match.currentQ % QUESTIONS.length];

    for (const player of match.players) {
      const chosen = match.answered[player.userId];

      if (chosen === question.answerIndex) {
        match.scores[player.userId] += 1;
      }
    }

    match.currentQ++;

    // Send next question
    startQuestion(io, matchId);
  }

  // --------------------------------------------------
  // END MATCH
  // --------------------------------------------------
  function endMatch(io, matchId) {
    const match = matches[matchId];
    if (!match) return;

    console.log(`[duel] MATCH END for ${matchId}`);

    io.to(matchId).emit("duel:match-end", {
      result: {
        scores: match.scores,
        winner: findWinner(match),
      },
    });

    // cleanup
    delete matches[matchId];
  }

  function findWinner(match) {
    const scores = match.scores;
    const entries = Object.entries(scores);
    if (!entries.length) return null;

    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0][1] === entries[1][1]) return "tie";

    return entries[0][0];
  }
};
