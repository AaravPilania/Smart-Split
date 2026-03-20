const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

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
