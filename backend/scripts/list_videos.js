require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const getPool = require('../config/db');

(async () => {
  try {
    const pool = getPool();
    const sql = `
      SELECT v.id, v.lesson_id, v.s3_key, l.title AS lesson_title
      FROM videos v
      LEFT JOIN lessons l ON l.id = v.lesson_id
      ORDER BY v.id DESC
      LIMIT 200;
    `;
    const res = await pool.query(sql);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
})();
