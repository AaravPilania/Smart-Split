const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

/* ── SSE client registry (in-memory, per-process) ────────────── */
const clients = new Map(); // userId → Set<{ res, lastActivity }>
const MAX_SSE_PER_USER = 3;
const SSE_TIMEOUT_MS = 120_000; // 2 min without activity → force close

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  const set = clients.get(userId);
  // Enforce per-user limit — drop oldest connection
  if (set.size >= MAX_SSE_PER_USER) {
    const oldest = set.values().next().value;
    try { oldest.res.end(); } catch {}
    set.delete(oldest);
  }
  set.add({ res, lastActivity: Date.now() });
}
function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  for (const entry of set) {
    if (entry.res === res) { set.delete(entry); break; }
  }
  if (set.size === 0) clients.delete(userId);
}

// Sweep dead SSE connections every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [userId, set] of clients) {
    for (const entry of set) {
      if (now - entry.lastActivity > SSE_TIMEOUT_MS) {
        try { entry.res.end(); } catch {}
        set.delete(entry);
      }
    }
    if (set.size === 0) clients.delete(userId);
  }
}, 60_000);

/** Push a server-sent event to all connections for a user */
function pushToUser(userId, data) {
  const set = clients.get(String(userId));
  if (!set) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const entry of set) {
    try { entry.res.write(payload); entry.lastActivity = Date.now(); }
    catch { /* dead conn — will be swept */ }
  }
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
    const heartbeat = setInterval(() => {
      try {
        res.write(':ping\n\n');
        // Update activity timestamp for this connection
        const set = clients.get(userId);
        if (set) for (const entry of set) { if (entry.res === res) entry.lastActivity = Date.now(); }
      } catch {}
    }, 30000);

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
