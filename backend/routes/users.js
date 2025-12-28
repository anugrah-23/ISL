// backend/routes/users.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');

router.get('/:id/achievements', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT ua.id, ua.awarded_at, a.id as achievement_id, a.key, a.name, a.description FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = $1 ORDER BY ua.awarded_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('users/achievements', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;