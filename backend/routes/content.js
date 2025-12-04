// backend/routes/content.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');
const { protect } = require('../middleware/auth');
const { activityMiddleware } = require('../middleware/activity');

// Module open
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
    console.error('modules/open error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Video complete
router.post('/videos/:id/complete', protect, activityMiddleware, async (req, res) => {
  const pool = getPool();
  try {
    const { id: userId } = req.user;
    const videoId = req.params.id;

    await pool.query(
      `INSERT INTO user_progress (user_id, video_id, completed_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET completed_at = now()`,
      [userId, videoId]
    );

    res.json({ success: true, message: 'Video marked complete' });
  } catch (err) {
    console.error('videos/complete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quiz submit
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
    console.error('quizzes/submit error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
