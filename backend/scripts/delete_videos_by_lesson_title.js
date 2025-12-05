// backend/scripts/delete_lessons_by_title.js
// Usage:
// node scripts/delete_lessons_by_title.js "YOU" "WHAT" "THANK_YOU" "HOW_(EXPLANATION)"
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const getPool = require('../config/db');

const titles = process.argv.slice(2);
if (!titles.length) {
  console.log('Usage: node scripts/delete_lessons_by_title.js "YOU" "WHAT" "THANK_YOU" "HOW_(EXPLANATION)"');
  process.exit(1);
}

(async () => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // find lessons
    const findSql = `SELECT id, title FROM lessons WHERE title ILIKE ANY (ARRAY[${titles.map((_,i)=>`$${i+1}`).join(',')}])`;
    const { rows } = await client.query(findSql, titles);

    if (!rows.length) {
      console.log('No lessons matched. Nothing to do.');
      await client.query('ROLLBACK');
      return process.exit(0);
    }

    console.log('Lessons to delete:', rows);

    // optionally: remove dependent rows in other tables if needed
    // delete user_progress referencing lesson_id
    const lessonIds = rows.map(r => r.id);
    await client.query('DELETE FROM user_progress WHERE module_id IS NULL AND video_id IS NULL AND lesson_id = ANY($1::int[])', [lessonIds])
      .catch(()=>{ /* ignore if column not present */});

    // delete quiz_results if tied to lesson? adjust if schema differs
    // delete videos rows (should already be deleted, but safe to run)
    await client.query('DELETE FROM videos WHERE lesson_id = ANY($1::int[])', [lessonIds]);

    // finally delete lessons
    const del = await client.query('DELETE FROM lessons WHERE id = ANY($1::int[]) RETURNING id, title', [lessonIds]);
    console.log('Deleted lessons:', del.rows);

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Error during delete, rolled back:', err.message || err);
  } finally {
    client.release();
    process.exit();
  }
})();
