// backend/routes/content.js
// content-related endpoints: module open, video complete (updates streak), quiz submit
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');
const { protect } = require('../middleware/auth');
const { activityMiddleware } = require('../middleware/activity');

/**
 * POST /api/content/modules/:id/open
 * record module open for the user
 */
router.post('/modules/:id/open', protect, activityMiddleware, async (req, res) => {
  const pool = getPool();
  try {
    const { id: userId } = req.user;
    const moduleId = req.params.id;

    await pool.query(
      `INSERT INTO user_progress (user_id, module_id, last_opened_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, module_id)
       DO UPDATE SET last_opened_at = now()`,
      [userId, moduleId]
    );

    res.json({ success: true, message: 'Module opened' });
  } catch (err) {
    console.error('modules/open error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/content/videos/:id/complete
 * mark video complete, update user's streak (story_progress) and last_activity
 */
router.post('/videos/:id/complete', protect, activityMiddleware, async (req, res) => {
  const pool = getPool();
  try {
    const { id: userId } = req.user;
    const videoId = Number(req.params.id);

    // upsert into user_progress for video completion
    await pool.query(
      `INSERT INTO user_progress (user_id, video_id, completed_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET completed_at = now()`,
      [userId, videoId]
    );

    // Update streak in story_progress table (story_id 'default' used by player)
    try {
      const now = new Date();
      const GRACE_DAYS = parseInt(process.env.STREAK_GRACE_DAYS || '2', 10);
      const oneDayMs = 24 * 60 * 60 * 1000;

      const { rows } = await pool.query(
        'SELECT id, unlocked_frames_bitmask, current_streak, last_practice_date, grace_until FROM story_progress WHERE user_id=$1 AND story_id=$2 LIMIT 1',
        [userId, 'default']
      );

      if (!rows.length) {
        // create new progress record (first exercise)
        const unlocked = Array(30).fill(false);
        unlocked[0] = true;
        await pool.query(
          'INSERT INTO story_progress (user_id, story_id, unlocked_frames_bitmask, current_streak, last_practice_date, grace_until, created_at) VALUES ($1,$2,$3,$4,$5,$6, now())',
          [userId, 'default', JSON.stringify(unlocked), 1, now, new Date(now.getTime() + GRACE_DAYS * oneDayMs)]
        );
      } else {
        const p = rows[0];
        const last = p.last_practice_date ? new Date(p.last_practice_date) : null;
        const todayMid = new Date(new Date().toDateString()); // midnight today
        const lastMid = last ? new Date(last.toDateString()) : null;
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

        await pool.query(
          'UPDATE story_progress SET current_streak=$1, last_practice_date=$2, grace_until=$3 WHERE id=$4',
          [current_streak, now, new Date(now.getTime() + GRACE_DAYS * oneDayMs), p.id]
        );
      }
    } catch (e) {
      console.warn('streak update failed:', e.message || e);
    }

    res.json({ success: true, message: 'Video marked complete' });
  } catch (err) {
    console.error('videos/complete error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/content/quizzes/:id/submit
 * record quiz submission
 */
router.post('/quizzes/:id/submit', protect, activityMiddleware, async (req, res) => {
  const pool = getPool();
  try {
    const { id: userId } = req.user;
    const quizId = req.params.id;
    const { score, answers } = req.body;

    await pool.query(
      `INSERT INTO quiz_results (user_id, quiz_id, score, answers, submitted_at)
       VALUES ($1, $2, $3, $4, now())`,
      [userId, quizId, score || null, JSON.stringify(answers || [])]
    );

    res.json({ success: true, message: 'Quiz submitted' });
  } catch (err) {
    console.error('quizzes/submit error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
