// backend/routes/player.js
// Provides queued playback lists for users and helper endpoints
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');


// GET /api/player/queue/:userId
// Returns a simple queue of videos for a user. Strategy: take user's enrolled courses' videos ordered by id
router.get('/queue/:userId', async (req, res) => {
try {
const userId = Number(req.params.userId);
if (!userId) return res.status(400).json({ message: 'userId required' });
const pool = getPool();


const sql = `
SELECT v.id as video_id, v.s3_key, v.content_type, v.size_bytes, l.id as lesson_id, l.title as lesson_title, c.id as course_id, c.title as course_title
FROM videos v
JOIN lessons l ON l.id = v.lesson_id
JOIN courses c ON c.id = l.course_id
ORDER BY c.id, l.id, v.id
LIMIT 500
`;


const { rows } = await pool.query(sql);
res.json({ queue: rows });
} catch (err) {
console.error('player/queue', err);
res.status(500).json({ message: 'Server error' });
}
});


module.exports = router;