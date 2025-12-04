// backend/scripts/upload_to_supabase.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_BUCKET) {
  console.error('ERROR: Missing SUPABASE env vars. Make sure backend/.env contains SUPABASE_URL, SUPABASE_SERVICE_KEY and SUPABASE_BUCKET');
  console.error('Current values:',
    'SUPABASE_URL=', !!process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_KEY=', !!process.env.SUPABASE_SERVICE_KEY,
    'SUPABASE_BUCKET=', !!process.env.SUPABASE_BUCKET
  );
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');
const getPool = require('../config/db');

const uploadsDir = path.join(os.homedir(), 'Downloads'); // change if needed
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || 'isl-videos';

function pool() { return getPool(); }

async function uploadFile(localPath, key) {
  const fileBuffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage.from(BUCKET).upload(key, fileBuffer, {
    contentType: 'video/mp4'
  });
  if (error) throw error;
  return data;
}

async function main() {
  const files = fs.readdirSync(uploadsDir).filter(f => /\.mp4$/i.test(f));
  if (!files.length) {
    console.log('No MP4 files found in', uploadsDir);
    process.exit(0);
  }

  const p = pool();
  try {
    const courseRes = await p.query('INSERT INTO courses (title, description) VALUES ($1,$2) RETURNING id', [
      'Supabase Uploads', 'Uploaded via script'
    ]);
    const courseId = courseRes.rows[0].id;
    console.log('Created course:', courseId);

    for (const file of files) {
      const localPath = path.join(uploadsDir, file);
      const key = `videos/${Date.now()}-${file.replace(/\s+/g, '_')}`;
      console.log('Uploading', file, '->', key);
      await uploadFile(localPath, key);
      console.log('Uploaded', file);

      const lessonRes = await p.query('INSERT INTO lessons (course_id, title) VALUES ($1,$2) RETURNING id', [courseId, path.parse(file).name]);
      const lessonId = lessonRes.rows[0].id;

      const stats = fs.statSync(localPath);
      await p.query('INSERT INTO videos (lesson_id, s3_key, size_bytes) VALUES ($1,$2,$3)', [lessonId, key, stats.size]);

      console.log('DB record created for', file);
    }

    console.log('Done uploading & seeding.');
  } catch (err) {
    console.error('upload script error', err.message || err);
  } finally {
    process.exit(0);
  }
}

main();
