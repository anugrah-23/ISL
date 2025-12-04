// backend/scripts/check_tables.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const getPool = require('../config/db');

(async () => {
  try {
    const pool = getPool();
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
    );
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error listing tables:', err.message || err);
  } finally {
    process.exit(0);
  }
})();
