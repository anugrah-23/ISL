// backend/routes/games.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');
const { protect } = require('../middleware/auth');

/**
 * GET /api/games/list
 * Returns upcoming/recent live games
 */
router.get('/list', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, key, title, scheduled_at, status FROM live_games ORDER BY scheduled_at NULLS FIRST, created_at DESC LIMIT 50');
    res.json({ games: rows });
  } catch (e) {
    console.error('games/list error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/games/create
 * Admin creates a game and questions (minimal)
 * body: { key, title, total_questions, question_time_seconds, questions: [{statement, options, answer_index}] }
 */
router.post('/create', protect, async (req, res) => {
  try {
    // NOTE: protect() just requires a token; ensure only admin can create in production
    const pool = getPool();
    const { key, title, total_questions = 10, question_time_seconds = 12, questions = [] } = req.body;
    const { rows } = await pool.query('INSERT INTO live_games (key, title, total_questions, question_time_seconds, status) VALUES ($1,$2,$3,$4,$5) RETURNING id', [key, title, total_questions, question_time_seconds, 'waiting']);
    const gameId = rows[0].id;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query('INSERT INTO live_game_questions (game_id, idx, statement, options, answer_index, meta) VALUES ($1,$2,$3,$4,$5,$6)', [gameId, i, q.statement, JSON.stringify(q.options), q.answer_index, JSON.stringify(q.meta || {})]);
    }
    res.json({ ok: true, id: gameId });
  } catch (e) {
    console.error('games/create error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
