// backend/lib/activity.js
const getPool = require('../config/db');

async function touchUserActivity(userId) {
  if (!userId) return;

  const pool = getPool();
  try {
    await pool.query(
      'UPDATE isl_users SET last_activity = now() WHERE id = $1',
      [userId]
    );
  } catch (err) {
    console.error('Failed to update activity:', err.message || err);
  }
}

module.exports = { touchUserActivity };
