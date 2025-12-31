// backend/routes/battles.js
// REST endpoints for battle rooms (listing, creating, inspecting, and closing).
// Most real-time logic (rounds, submissions, voting) happens in sockets/battles.js.
// These endpoints are helpers for UI and admin flows.

const express = require('express');
const router = express.Router();
const getPool = require('../config/db');

/**
 * GET /api/battles/lobby
 * List recent rooms
 */
router.get('/lobby', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, room_key, type, meta, createdat FROM battle_rooms ORDER BY createdat DESC LIMIT 200'
    );
    res.json({ rooms: rows });
  } catch (err) {
    console.error('battles/lobby', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/battles/create
 * Body: { type?: string, meta?: object }
 * Creates a room row and returns it
 */
router.post('/create', async (req, res) => {
  try {
    const pool = getPool();
    const { type = '1v1', meta = {} } = req.body || {};
    const roomKey = `room_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const { rows } = await pool.query(
      'INSERT INTO battle_rooms (room_key, type, meta) VALUES ($1,$2,$3) RETURNING id, room_key, type, meta, createdat',
      [roomKey, type, JSON.stringify(meta)]
    );
    res.json({ ok: true, room: rows[0] });
  } catch (err) {
    console.error('battles/create', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/battles/:roomKey
 * Returns a single room by key
 */
router.get('/:roomKey', async (req, res) => {
  try {
    const pool = getPool();
    const { roomKey } = req.params;
    const { rows } = await pool.query('SELECT id, room_key, type, meta, createdat FROM battle_rooms WHERE room_key = $1 LIMIT 1', [roomKey]);
    if (!rows.length) return res.status(404).json({ message: 'Room not found' });
    res.json({ room: rows[0] });
  } catch (err) {
    console.error('battles/get', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/battles/:roomKey/record
 * Accepts a small payload to persist a battle result or metadata.
 * Body: { winnerId?: number, details?: object }
 * This is optional — sockets usually emit real-time results. Use this to persist a final result.
 */
router.post('/:roomKey/record', async (req, res) => {
  try {
    const pool = getPool();
    const { roomKey } = req.params;
    const { winnerId = null, details = {} } = req.body || {};
    // store in battle_rooms.meta.history (append) or create a separate table for long-term storage
    // For simplicity: update meta.history (array) with new entry
    const q = `
      UPDATE battle_rooms
      SET meta = CASE
        WHEN meta IS NULL THEN $2::jsonb
        ELSE jsonb_set(meta, '{history}', COALESCE((meta->'history')::jsonb, '[]'::jsonb) || $2::jsonb)
      END
      WHERE room_key = $1
      RETURNING id, room_key, meta
    `;
    const entry = { ts: new Date().toISOString(), winnerId, details };
    const { rows } = await pool.query(q, [roomKey, JSON.stringify(entry)]);
    if (!rows.length) return res.status(404).json({ message: 'Room not found' });
    res.json({ ok: true, room: rows[0] });
  } catch (err) {
    console.error('battles/record', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;