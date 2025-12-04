// backend/scripts/run_migrations.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const getPool = require('../config/db');

async function run() {
  const pool = getPool();
  const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '001_create_media_tables.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration SQL not found at', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

run();
