// backend/routes/videos.js
const express = require('express');
const router = express.Router();
const getPool = require('../config/db');
const { getPresignedGetUrl, getPresignedPutUrl } = require('../lib/r2');

router.get('/:id/presign', async (req, res) => {
  try {
    const videoId = req.params.id;
    const pool = getPool();
    const { rows } = await pool.query('SELECT s3_key FROM videos WHERE id = $1 LIMIT 1', [videoId]);
    if (!rows.length) return res.status(404).json({ message: 'Video not found' });
    const key = rows[0].s3_key;
    if (!key) return res.status(404).json({ message: 'No storage key for video' });
    const url = await getPresignedGetUrl(key, 60 * 60 * 2); // 2 hours
    res.json({ url, key });
  } catch (err) {
    console.error('videos/presign error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/presign-put', async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ message: 'key query param required' });
    const contentType = req.query.contentType || 'video/mp4';
    const url = await getPresignedPutUrl(key, 60, contentType);
    res.json({ url, key });
  } catch (err) {
    console.error('videos/presign-put error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
