const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

/* ── SSE client registry (in-memory, per-process) ────────────── */
const clients = new Map(); // userId → Set<res>

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}
function removeClient(userId, res) {
  const set = clients.get(userId);
  if (set) { set.delete(res); if (set.size === 0) clients.delete(userId); }
}
/** Push a server-sent event to all connections for a user */
function pushToUser(userId, data) {
  const set = clients.get(String(userId));
  if (!set) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) { try { res.write(payload); } catch { /* dead conn */ } }
}

// GET /api/notifications/stream — SSE endpoint (auth via query token)
router.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ message: 'token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = String(decoded.userId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx/render proxy hint
    });
    res.write(':ok\n\n'); // initial comment to confirm connection

    addClient(userId, res);
    const heartbeat = setInterval(() => { try { res.write(':ping\n\n'); } catch {} }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      removeClient(userId, res);
    });
  } catch {
    return res.status(401).json({ message: 'invalid token' });
  }
});

// GET /api/notifications — get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Notification.find({ to: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('from', 'name email');
    res.json({ notifications: notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications — create a reminder notification
router.post('/', auth, async (req, res) => {
  try {
    const { to, message, groupId, amount } = req.body;
    if (!to || !message) return res.status(400).json({ message: 'to and message are required' });
    const note = await Notification.create({
      to,
      from: req.user.id,
      message,
      groupId: groupId || undefined,
      amount:  amount  || undefined,
    });
    await note.populate('from', 'name email');
    // Push real-time SSE event to the recipient
    pushToUser(to, { type: 'notification', notification: note });
    res.status(201).json({ notification: note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all — mark all as read (must be before /:id/read)
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ to: req.user.id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, to: req.user.id },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.pushToUser = pushToUser;
