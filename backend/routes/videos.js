const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.get('/:id/presign', async (req, res) => {
  try {
    const videoId = req.params.id;

    // 1. Fetch DB record for this video
    const pool = require('../config/db')();
    const result = await pool.query(
      'SELECT s3_key FROM videos WHERE id = $1 LIMIT 1',
      [videoId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const filePath = result.rows[0].s3_key; // example: "videos/myfile.mp4"

    // 2. Generate signed URL (valid for 2 hours)
    const { data, error } = await supabase
      .storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl(filePath, 60 * 120); // 120 minutes

    if (error) {
      console.error('Signed URL error:', error);
      return res.status(500).json({ message: 'Failed to create signed URL' });
    }

    return res.json({ url: data.signedUrl });
  } catch (err) {
    console.error('presign route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
