// backend/routes/courses.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');

/**
 * GET /api/courses
 * Returns: [ { id, title, description, lessons: [ { id, title, transcript, videos: [ { id, s3_key, content_type, size_bytes } ] } ] } ]
 */
router.get('/', async (req, res) => {
  const pool = getPool();
  try {
    // This single query returns a courses -> lessons -> videos nested JSON structure
    const sql = `
      SELECT
        c.id,
        c.title,
        c.description,
        COALESCE(json_agg(ls) FILTER (WHERE ls.id IS NOT NULL), '[]') AS lessons
      FROM courses c
      LEFT JOIN (
        SELECT
          l.id,
          l.course_id,
          l.title,
          l.transcript,
          COALESCE(json_agg(v) FILTER (WHERE v.id IS NOT NULL), '[]') AS videos
        FROM lessons l
        LEFT JOIN (
          SELECT id, lesson_id, s3_key, content_type, size_bytes
          FROM videos
          ORDER BY id
        ) v ON v.lesson_id = l.id
        GROUP BY l.id
        ORDER BY l.id
      ) ls ON ls.course_id = c.id
      GROUP BY c.id
      ORDER BY c.id;
    `;

    const { rows } = await pool.query(sql);

    // rows already contain lessons as JSON; convert lessons field from string to array if needed
    const out = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      lessons: r.lessons // already JSON array
    }));

    return res.json(out);
  } catch (err) {
    console.error('/api/courses error:', err.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
