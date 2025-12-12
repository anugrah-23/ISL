// backend/scripts/upload_to_r2.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const os = require('os');
const getPool = require('../config/db');
const { putObject } = require('../lib/r2');

const uploadsDir = path.join(os.homedir(), 'Downloads');

async function uploadFile(localPath, storageKey) {
  const buffer = fs.readFileSync(localPath);
  await putObject({ Key: storageKey, Body: buffer, ContentType: 'video/mp4' });
  return { key: storageKey, size: buffer.length };
}

(async function main(){
  if (!process.env.R2_BUCKET) {
    console.error('Missing R2_BUCKET env var');
    process.exit(1);
  }
  const pool = getPool();
  const files = fs.readdirSync(uploadsDir).filter(f => /\.mp4$/i.test(f));
  if (!files.length) { console.log('No mp4 files'); process.exit(0); }

  for (const file of files) {
    try {
      const localPath = path.join(uploadsDir, file);
      const storageKey = `videos/${Date.now()}-${file.replace(/\s+/g,'_')}`;
      await uploadFile(localPath, storageKey);
      const stats = fs.statSync(localPath);
      const courseRes = await pool.query("SELECT id FROM courses WHERE title = $1 LIMIT 1", ['R2 Uploads']);
      let courseId;
      if (courseRes.rows.length) courseId = courseRes.rows[0].id;
      else {
        const r = await pool.query("INSERT INTO courses (title, description) VALUES ($1,$2) RETURNING id", ['R2 Uploads', 'Uploaded via script']);
        courseId = r.rows[0].id;
      }
      const lessonRes = await pool.query('INSERT INTO lessons (course_id, title) VALUES ($1,$2) RETURNING id', [courseId, path.parse(file).name]);
      const lessonId = lessonRes.rows[0].id;
      await pool.query('INSERT INTO videos (lesson_id, s3_key, content_type, size_bytes, status) VALUES ($1,$2,$3,$4,$5)', [lessonId, storageKey, 'video/mp4', stats.size, 'uploaded']);
      console.log('Uploaded & recorded:', file);
    } catch (err) {
      console.error('Upload error for', file, err.message || err);
    }
  }
  console.log('Done');
  process.exit(0);
})();
