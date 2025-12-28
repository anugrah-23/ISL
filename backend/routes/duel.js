// backend/routes/duel.js
const express = require('express');
const router = express.Router();

const queues = new Map();   // queueId -> entry
const waiting = new Map();  // key -> queueId (first waiting)

function settingsKey(mode, duration) {
  return `${String(mode || 'competitive')}_${Number(duration || 1)}`;
}

router.post('/join', (req, res) => {
  try {
    const io = req.app.get('io');

    const { userId, username, mode, duration } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const queueId = `q_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const entry = {
      queueId,
      userId,
      username: username || `user_${userId}`,
      mode: mode || 'competitive',
      duration: duration || 1,
      status: 'waiting',
      matchWith: null,
      createdAt: Date.now(),
    };

    queues.set(queueId, entry);
    const key = settingsKey(entry.mode, entry.duration);
    console.log(`[duel] JOIN queueId=${queueId} user=${entry.username} key=${key}`);

    const waitingQueueId = waiting.get(key);

    let matchPayload = null;

    if (waitingQueueId && waitingQueueId !== queueId && queues.has(waitingQueueId)) {
      const other = queues.get(waitingQueueId);

      entry.status = 'matched';
      entry.matchWith = waitingQueueId;
      other.status = 'matched';
      other.matchWith = queueId;

      queues.set(queueId, entry);
      queues.set(waitingQueueId, other);
      waiting.delete(key);

      console.log(`[duel] MATCHED ${queueId} <--> ${waitingQueueId} (key=${key})`);

      const matchId = `m_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      // matchKey is same as matchId for frontend convenience
      matchPayload = {
        matchId,
        matchKey: matchId,
        settings: { mode: entry.mode, duration: entry.duration },
        players: [
          { queueId, userId: entry.userId, username: entry.username },
          { queueId: waitingQueueId, userId: other.userId, username: other.username }
        ]
      };

      if (io) {
        try {
          io.to(queueId).emit('matched', matchPayload);
          io.to(waitingQueueId).emit('matched', matchPayload);
          console.log('[duel] emitted matched event to rooms:', queueId, waitingQueueId);
        } catch (e) {
          console.warn('[duel] emit matched failed', e);
        }
      }
    } else {
      waiting.set(key, queueId);
      console.log(`[duel] WAITING key=${key} -> ${queueId}`);
    }

    // Return queueId and match info (if matched) so client can redirect immediately even if socket event missed
    return res.json({ queueId, matched: !!matchPayload, match: matchPayload });
  } catch (err) {
    console.error('duel join error', err);
    return res.status(500).json({ message: 'internal' });
  }
});

router.get('/:queueId/status', (req, res) => {
  const entry = queues.get(req.params.queueId);
  if (!entry) return res.status(404).json({ message: 'not_found' });
  // include a matchKey if entry.status === 'matched' and match info exists
  return res.json(entry);
});

router.post('/:queueId/cancel', (req, res) => {
  const queueId = req.params.queueId;
  const entry = queues.get(queueId);
  if (!entry) return res.status(404).json({ ok: false });

  const key = settingsKey(entry.mode, entry.duration);
  if (waiting.get(key) === queueId) waiting.delete(key);

  entry.status = 'cancelled';
  queues.set(queueId, entry);
  console.log(`[duel] CANCELLED queueId=${queueId}`);
  return res.json({ ok: true });
});

// debug endpoints
router.get('/__debug/all', (req, res) => {
  const q = {};
  for (const [k, v] of queues.entries()) q[k] = v;
  res.json(q);
});

router.get('/__debug/waiting', (req, res) => {
  const w = {};
  for (const [k, v] of waiting.entries()) w[k] = v;
  res.json(w);
});

module.exports = router;