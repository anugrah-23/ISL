// backend/config/db.js
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  if (!process.env.NEON_DB_URL) {
    throw new Error('NEON_DB_URL is not defined in .env');
  }

  pool = new Pool({
    connectionString: process.env.NEON_DB_URL,
  });

  // test connection
  pool.query('SELECT 1')
    .then(() => console.log('Connected to NeonDB (Postgres)'))
    .catch(err => console.error('Failed to connect to NeonDB:', err.message || err));

  return pool;
}

module.exports = getPool;
