// backend/scripts/find_lessons_by_title.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const getPool = require('../config/db');

const titles = process.argv.slice(2);
if (!titles.length) {
  console.log('Usage: node scripts/find_lessons_by_title.js "YOU" "WHAT" "THANK_YOU" "HOW_(EXPLANATION)"');
  process.exit(1);
}

(async () => {
  const pool = getPool();
  const params = titles.map((t, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT id, course_id, title FROM lessons WHERE title ILIKE ANY (ARRAY[${params}]) ORDER BY id;`;
  try {
    const res = await pool.query(sql, titles);
    console.log('Found lessons:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
