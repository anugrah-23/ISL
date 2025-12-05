// backend/scripts/delete_lessons_safe.js
// Usage:
//   node scripts/delete_lessons_safe.js "YOU" "WHAT" "THANK_YOU" "HOW_(EXPLANATION)"
//
// This script:
//  - finds lessons matching the provided titles (ILIKE exact match per title)
//  - lists dependent rows in common tables (videos, user_progress, quiz_results)
//  - attempts to delete dependent rows (each delete wrapped in try/catch so we keep going)
//  - deletes the lessons
//
// It intentionally avoids wrapping everything in a single transaction so a
// single constraint/error won't leave the DB in an aborted transaction state.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const getPool = require('../config/db');

const titles = process.argv.slice(2);
if (!titles.length) {
  console.log('Usage: node scripts/delete_lessons_safe.js "YOU" "WHAT" "THANK_YOU" "HOW_(EXPLANATION)"');
  process.exit(1);
}

function placeholderList(n, startIndex=1) {
  return Array.from({length:n}, (_,i) => `$${i + startIndex}`).join(', ');
}

(async () => {
  const pool = getPool();
  try {
    // 1) find matching lessons
    const findSql = `SELECT id, course_id, title FROM lessons WHERE title ILIKE ANY (ARRAY[${titles.map((_,i)=>`$${i+1}`).join(',')}]) ORDER BY id`;
    const findRes = await pool.query(findSql, titles);
    if (!findRes.rows.length) {
      console.log('No lessons matched the given titles:', titles);
      return process.exit(0);
    }

    const lessons = findRes.rows;
    console.log('Found lessons to remove:', lessons);

    const lessonIds = lessons.map(l => l.id);

    // 2) show dependents (videos)
    try {
      const q = await pool.query('SELECT id, lesson_id, s3_key FROM videos WHERE lesson_id = ANY($1::int[]) ORDER BY id', [lessonIds]);
      console.log('videos referencing these lessons:', q.rows);
    } catch (e) {
      console.warn('Could not query videos table:', e.message || e);
    }

    // 3) show user_progress rows if column exists
    try {
      const cols = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='user_progress'")).rows.map(r=>r.column_name);
      console.log('user_progress columns:', cols);
      if (cols.includes('lesson_id')) {
        const up = await pool.query('SELECT * FROM user_progress WHERE lesson_id = ANY($1::int[]) ORDER BY id LIMIT 200', [lessonIds]);
        console.log('user_progress rows referencing these lessons (limit 200):', up.rows);
      } else {
        console.log('user_progress does not have lesson_id column; skipping.');
      }
    } catch (e) {
      console.warn('Could not inspect user_progress:', e.message || e);
    }

    // 4) show quiz_results if it references lesson (common patterns)
    try {
      const colsQ = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='quiz_results'")).rows.map(r=>r.column_name);
      console.log('quiz_results columns:', colsQ);
      if (colsQ.includes('lesson_id')) {
        const qr = await pool.query('SELECT * FROM quiz_results WHERE lesson_id = ANY($1::int[]) ORDER BY id LIMIT 200', [lessonIds]);
        console.log('quiz_results referencing lessons:', qr.rows);
      } else {
        console.log('quiz_results has no lesson_id column (likely quiz_id only).');
      }
    } catch (e) {
      console.warn('Could not inspect quiz_results:', e.message || e);
    }

    // 5) Now attempt deletions (best-effort). Each delete is try/catch so failure won't abort others.
    // 5.1 delete videos
    try {
      const delV = await pool.query('DELETE FROM videos WHERE lesson_id = ANY($1::int[]) RETURNING id, lesson_id, s3_key', [lessonIds]);
      console.log('Deleted video rows:', delV.rows);
    } catch (e) {
      console.warn('Failed to delete from videos:', e.message || e);
    }

    // 5.2 delete user_progress rows referencing lesson_id if column exists
    try {
      const cols = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='user_progress'")).rows.map(r=>r.column_name);
      if (cols.includes('lesson_id')) {
        const delUP = await pool.query('DELETE FROM user_progress WHERE lesson_id = ANY($1::int[]) RETURNING id, user_id, lesson_id', [lessonIds]);
        console.log('Deleted user_progress rows:', delUP.rows);
      } else {
        console.log('Skipped deleting user_progress by lesson_id (column not present).');
      }
    } catch (e) {
      console.warn('Failed to delete from user_progress:', e.message || e);
    }

    // 5.3 delete quiz_results if it has lesson_id
    try {
      const colsQ = (await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='quiz_results'")).rows.map(r=>r.column_name);
      if (colsQ.includes('lesson_id')) {
        const delQR = await pool.query('DELETE FROM quiz_results WHERE lesson_id = ANY($1::int[]) RETURNING id, user_id, lesson_id', [lessonIds]);
        console.log('Deleted quiz_results rows:', delQR.rows);
      } else {
        console.log('Skipped deleting quiz_results by lesson_id (column not present).');
      }
    } catch (e) {
      console.warn('Failed to delete from quiz_results:', e.message || e);
    }

    // 6) Finally, delete the lessons themselves
    try {
      const delL = await pool.query('DELETE FROM lessons WHERE id = ANY($1::int[]) RETURNING id, title', [lessonIds]);
      console.log('Deleted lessons:', delL.rows);
    } catch (e) {
      console.error('Failed to delete lessons (foreign keys may remain):', e.message || e);
      console.log('You may need to identify remaining foreign key constraints that reference lessons.');
      // show fk constraints referencing lessons
      try {
        const fk = await pool.query(`
          SELECT
            tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
          FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'lessons';
        `);
        console.log('Foreign keys referencing lessons (ccu.table_name = lessons):', fk.rows);
      } catch (e2) {
        console.warn('Could not list foreign keys:', e2.message || e2);
      }
    }

    console.log('All done. Please re-run your list_videos.js and /api/courses to confirm the UI state.');
  } catch (err) {
    console.error('Fatal error:', err.message || err);
  } finally {
    process.exit();
  }
})();
