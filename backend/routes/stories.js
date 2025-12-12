// backend/routes/stories.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');
const { getPresignedPutUrl } = require('../lib/r2');

// metadata
router.get('/:storyId', async (req, res) => {
  const storyId = req.params.storyId;
  const frames = Array.from({ length: 30 }, (_, i) => ({ index: i, caption: `Day ${i+1}` }));
  res.json({ storyId, frames });
});

// get user's progress
router.get('/users/:userId/:storyId', async (req, res) => {
  try {
    const { userId, storyId } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, unlocked_frames_bitmask, current_streak, last_practice_date, grace_until FROM story_progress WHERE user_id=$1 AND story_id=$2 LIMIT 1', [userId, storyId]);
    if (!rows.length) return res.json({ unlocked_frames_bitmask: [], current_streak: 0 });
    return res.json(rows[0]);
  } catch (err) {
    console.error('stories/get progress', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// unlock frame
router.post('/users/:userId/unlock', async (req, res) => {
  try {
    const { userId } = req.params;
    const { storyId, frameIndex } = req.body;
    if (typeof frameIndex !== 'number') return res.status(400).json({ error: 'frameIndex required' });

    const pool = getPool();
    const now = new Date();
    const GRACE_DAYS = parseInt(process.env.STREAK_GRACE_DAYS || '2', 10);
    const oneDayMs = 24*60*60*1000;

    const { rows } = await pool.query('SELECT id, unlocked_frames_bitmask, current_streak, last_practice_date, grace_until FROM story_progress WHERE user_id=$1 AND story_id=$2 LIMIT 1', [userId, storyId]);

    if (!rows.length) {
      const unlocked = Array(30).fill(false); unlocked[frameIndex]=true;
      const insert = await pool.query('INSERT INTO story_progress (user_id, story_id, unlocked_frames_bitmask, current_streak, last_practice_date, grace_until) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [userId, storyId, JSON.stringify(unlocked), 1, now, new Date(now.getTime()+GRACE_DAYS*oneDayMs)]);
      return res.json({ ok: true, progress: insert.rows[0] });
    }

    const p = rows[0];
    const unlocked = Array.isArray(p.unlocked_frames_bitmask) ? p.unlocked_frames_bitmask : (p.unlocked_frames_bitmask || Array(30).fill(false));
    unlocked[frameIndex] = true;

    const last = p.last_practice_date ? new Date(p.last_practice_date) : null;
    const lastMid = last ? new Date(last.toDateString()) : null;
    const todayMid = new Date(new Date().toDateString());
    let current_streak = p.current_streak || 0;

    if (!last || (todayMid - lastMid) >= oneDayMs) {
      const withinGrace = p.grace_until && new Date() <= new Date(p.grace_until);
      if (withinGrace) current_streak = current_streak + 1;
      else if (!last) current_streak = 1;
      else {
        const diffDays = Math.floor((todayMid - lastMid) / oneDayMs);
        if (diffDays === 1) current_streak = current_streak + 1;
        else current_streak = 1;
      }
    }

    const update = await pool.query('UPDATE story_progress SET unlocked_frames_bitmask=$1, current_streak=$2, last_practice_date=$3, grace_until=$4 WHERE id=$5 RETURNING *', [JSON.stringify(unlocked), current_streak, now, new Date(now.getTime()+GRACE_DAYS*oneDayMs), p.id]);
    res.json({ ok: true, progress: update.rows[0] });
  } catch (err) {
    console.error('stories/unlock error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// presign-put helper (optional)
router.get('/media/presign-put', async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ message: 'key required' });
    const url = await getPresignedPutUrl(key, 60, req.query.contentType || 'video/mp4');
    res.json({ url, key });
  } catch (err) {
    console.error('stories/presign-put', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
