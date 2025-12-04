// backend/routes/courses.js
const express = require('express');
const getPool = require('../config/db');

const router = express.Router();
function pool() { return getPool(); }

/**
 * GET /api/courses
 * Returns an array of courses with nested lessons and video ids (no private URLs)
 */
router.get('/', async (req, res) => {
  try {
    const p = pool();
    const coursesQ = await p.query('SELECT id, title, description FROM courses ORDER BY created_at DESC');
    const out = [];

    for (const c of coursesQ.rows) {
      const lessonsQ = await p.query('SELECT id, title FROM lessons WHERE course_id = $1 ORDER BY sort_order, created_at', [c.id]);
      const lessons = [];
      for (const l of lessonsQ.rows) {
        const vidsQ = await p.query('SELECT id, url, content_type, size_bytes, duration_sec, status FROM videos WHERE lesson_id = $1', [l.id]);
        const videos = vidsQ.rows.map(v => ({
          id: v.id,
          videoUrl: v.url || null, // may be null; frontend can call presign using id
          content_type: v.content_type,
          size_bytes: v.size_bytes,
          duration_sec: v.duration_sec,
          status: v.status
        }));
        lessons.push({
          id: l.id,
          title: l.title,
          videos
        });
      }
      out.push({
        id: c.id,
        title: c.title,
        description: c.description,
        lessons
      });
    }

    res.json(out);
  } catch (err) {
    console.error('GET /api/courses error', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
