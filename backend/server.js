// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cron = require('node-cron');

const getPool = require('./config/db');
const { scheduleReminders } = require('./jobs/reminder-jobs');
const runAchievementEngine = require('./jobs/achievement-engine');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// REST API ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/content', require('./routes/content'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/duel', require('./routes/duel'));

app.use('/api/stories', require('./routes/stories'));
app.use('/api/battles', require('./routes/battles'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/player', require('./routes/player'));

app.get('/health', (req, res) => res.json({ ok: true }));

// HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
app.set('io', io);

// SOCKET HANDLERS
require('./sockets/battles')(io);
require('./sockets/games')(io);
require('./sockets/duel')(io);       // ⭐ REQUIRED FOR MATCHMAKING

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  try { scheduleReminders(); }
  catch (e) { console.warn('Reminder scheduling failed', e.message); }

  const achCron = process.env.ACHIEVEMENTS_CRON || '15 3 * * *';
  cron.schedule(achCron, async () => {
    console.log('Achievement cron triggered');
    try { await runAchievementEngine(); }
    catch (e) { console.error('Achievement run failed', e.message); }
  }, { timezone: process.env.ACHIEVEMENTS_TZ || 'UTC' });
});
