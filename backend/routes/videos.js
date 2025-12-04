// backend/routes/videos.js
const express = require('express');
const multer = require('multer');
const getPool = require('../config/db');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB

// Supabase server-side client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || 'isl-videos';

function pool() { return getPool(); }

/**
 * POST /api/videos/:lessonId/upload
 * form field: file
 */
router.post('/:lessonId/upload', upload.single('file'), async (req, res) => {
  const lessonId = req.params.lessonId;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded (field name: file)' });

  try {
    const original = req.file.originalname || 'upload.mp4';
    const key = `videos/${lessonId}/${Date.now()}-${original.replace(/\s+/g, '_')}`;
    const contentType = req.file.mimetype || 'video/mp4';

    // Upload to Supabase Storage
    const { data: upData, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(key, req.file.buffer, { contentType });

    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return res.status(500).json({ message: 'Upload failed' });
    }

    // Save metadata in DB (s3_key used as storage path)
    const p = pool();
    const sql = `INSERT INTO videos (lesson_id, s3_key, url, content_type, size_bytes, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const storagePath = key;
    const { rows } = await p.query(sql, [lessonId, storagePath, null, contentType, req.file.size, 'uploaded']);

    return res.json({ success: true, video: rows[0] });
  } catch (err) {
    console.error('videos.upload error', err.message || err);
    return res.status(500).json({ message: 'Upload failed' });
  }
});

/**
 * GET /api/videos/:id/presign
 * returns { url }
 */
router.get('/:id/presign', async (req, res) => {
  const id = req.params.id;
  try {
    const p = pool();
    const { rows } = await p.query('SELECT s3_key FROM videos WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Not found' });
    const storagePath = rows[0].s3_key;
    if (!storagePath) return res.status(400).json({ message: 'Video has no stored path' });

    const expiresInSeconds = 60 * 60; // 1 hour
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
    if (error) {
      console.error('Supabase presign error', error);
      return res.status(500).json({ message: 'Failed to create signed URL' });
    }

    return res.json({ url: data.signedUrl || data.signedURL || data.signedURL });
  } catch (err) {
    console.error('videos.presign error:', err.message || err);
    res.status(500).json({ message: 'Failed to presign' });
  }
});

module.exports = router;
