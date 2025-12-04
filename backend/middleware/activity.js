// backend/middleware/activity.js
const getPool = require('../config/db');

async function touchUserActivity(userId) {
  if (!userId) return;

  try {
    const pool = getPool();
    const q = `
      UPDATE isl_users
      SET last_activity = now()
      WHERE id = $1
        AND (last_activity IS NULL OR last_activity <= now() - INTERVAL '1 minute')
    `;
    pool.query(q, [userId]).catch(() => {});
  } catch (err) {
    console.error('touchUserActivity error:', err.message || err);
  }
}

function activityMiddleware(req, res, next) {
  try {
    const userId = req.user?.id;
    if (userId) touchUserActivity(userId);
  } catch (err) {
    console.error('activityMiddleware error:', err.message || err);
  }

  next();
}

module.exports = { touchUserActivity, activityMiddleware };
