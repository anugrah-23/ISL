// backend/server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const getPool = require('./config/db');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');

let remindersRoutes;
try {
  remindersRoutes = require('./routes/reminders');
} catch {
  remindersRoutes = null;
}

const { scheduleReminders } = require('./jobs/reminder-job');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://your-production-domain.com'
        : 'http://localhost:3000',
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
if (remindersRoutes) app.use('/api/reminders', remindersRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server is running' })
);

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    getPool(); // Initialize DB

    if (String(process.env.ENABLE_REMINDERS).toLowerCase() === 'true') {
      scheduleReminders();
      console.log('Reminder scheduler enabled.');
    } else {
      console.log('Reminder scheduler disabled.');
    }

    app.listen(PORT, () =>
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      )
    );
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
