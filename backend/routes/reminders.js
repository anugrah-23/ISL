// backend/routes/reminders.js
const express = require('express');
const router = express.Router();
const { sendDueReminders } = require('../jobs/reminder-jobs');

router.post('/run-now', async (req, res) => {
  const secret = req.headers['x-admin-secret'];

  if (!secret || secret !== process.env.REMINDER_ADMIN_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const result = await sendDueReminders();
    res.json({ success: true, result });
  } catch (err) {
    console.error('Manual reminder run failed:', err.message);
    res.status(500).json({ message: 'Failed to run reminders' });
  }
});

module.exports = router;
