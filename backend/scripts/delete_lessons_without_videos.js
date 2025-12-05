// backend/scripts/delete_lessons_without_videos.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const getPool = require('../config/db');

(async () => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find lessons without videos
    const { rows } = await client.query(`
      SELECT l.id, l.title
      FROM lessons l
      LEFT JOIN videos v ON v.lesson_id = l.id
      WHERE v.id IS NULL
      ORDER BY l.id;
    `);

    if (!rows.length) {
      console.log('No lessons without videos found.');
      await client.query('ROLLBACK');
      return process.exit(0);
    }

    console.log('Lessons without videos (will be deleted):', rows);

    const ids = rows.map(r => r.id);

    // delete user_progress referencing these lessons (best-effort)
    await client.query('DELETE FROM user_progress WHERE module_id IS NULL AND video_id IS NULL AND lesson_id = ANY($1::int[])', [ids])
      .catch(()=>{});

    // delete lessons
    const del = await client.query('DELETE FROM lessons WHERE id = ANY($1::int[]) RETURNING id, title', [ids]);
    console.log('Deleted lessons:', del.rows);

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Error, rolled back:', err.message || err);
  } finally {
    client.release();
    process.exit();
  }
})();
