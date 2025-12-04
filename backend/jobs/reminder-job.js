// backend/jobs/reminder-jobs.js
const cron = require('node-cron');
const getPool = require('../config/db');
const { sendMail } = require('../lib/email');

async function sendDueReminders({ limit = 100 } = {}) {
  const pool = getPool();
  const days = Number(process.env.REMINDER_DAYS || 3);

  const query = `
    SELECT id, name, email, last_activity, last_reminder_sent
    FROM isl_users
    WHERE (
      last_activity IS NULL
      OR last_activity <= now() - ($1::int * INTERVAL '1 day')
    )
    AND (
      last_reminder_sent IS NULL
      OR (last_activity IS NOT NULL AND last_reminder_sent < last_activity)
      OR (last_activity IS NULL AND last_reminder_sent IS NULL)
    )
    ORDER BY last_activity NULLS FIRST, id
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [days, limit]);

  let sent = 0;
  for (const user of rows) {
    try {
      const subject = 'We miss you — continue your ISL learning';
      const text = `Hi ${user.name || 'Learner'},\n\nWe noticed you haven't practiced in a while. Come back to continue your ISL journey!\n\nOpen the app: https://your-frontend-url\n\n— ISL Learning Team`;
      const html = `<p>Hi ${user.name || 'Learner'},</p>
        <p>We noticed you haven't practiced in a while. Come back to continue your ISL journey!</p>
        <p><a href="https://your-frontend-url">Open the ISL Learning app</a></p>
        <p>— ISL Learning Team</p>`;

      await sendMail({ to: user.email, subject, text, html });
      await pool.query('UPDATE isl_users SET last_reminder_sent = now() WHERE id = $1', [user.id]);
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder to ${user.email}:`, err.message || err);
    }
  }

  return { sent, total: rows.length };
}

function scheduleReminders() {
  const cronExpr = process.env.REMINDER_CRON || '0 9 * * *';
  console.log(`Scheduling reminders with cron: "${cronExpr}"`);

  cron.schedule(
    cronExpr,
    async () => {
      console.log('Reminder cron triggered', new Date().toISOString());
      try {
        const res = await sendDueReminders();
        console.log(`Reminder job: sent ${res.sent}/${res.total}`);
      } catch (err) {
        console.error('Reminder job failed', err.message || err);
      }
    },
    {
      scheduled: true,
      timezone: process.env.REMINDER_TZ || undefined,
    }
  );
}

module.exports = { sendDueReminders, scheduleReminders };
