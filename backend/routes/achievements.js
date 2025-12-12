// backend/routes/achievements.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');

router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { key, name, description = null, secret = false, trigger_spec = {}, reward = {} } = req.body;
    const { rows } = await pool.query('INSERT INTO achievements (key, name, description, secret, trigger_spec, reward) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [key, name, description, secret, JSON.stringify(trigger_spec), JSON.stringify(reward)]);
    res.json(rows[0]);
  } catch (err) {
    console.error('achievements/create', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, key, name, description, secret, trigger_spec, reward, created_at FROM achievements ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('achievements/list', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
