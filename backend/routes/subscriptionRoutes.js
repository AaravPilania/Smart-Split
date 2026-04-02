const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/subscriptions — list user's subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.findByUser(req.user.id);
    res.json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
});

// POST /api/subscriptions — create a subscription
router.post('/', async (req, res) => {
  try {
    const { name, amount, category, billingCycle, nextBillingDate, color, icon } = req.body;
    if (!name || !amount || !nextBillingDate) {
      return res.status(400).json({ message: 'Name, amount, and next billing date are required' });
    }
    const sub = await Subscription.create({
      user: req.user.id,
      name: String(name).slice(0, 100),
      amount: Number(amount),
      category: category ? String(category).slice(0, 50) : 'subscription',
      billingCycle: billingCycle || 'monthly',
      nextBillingDate: new Date(nextBillingDate),
      color: color || '#6b7280',
      icon: icon ? String(icon).slice(0, 10) : '',
    });
    res.status(201).json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// PUT /api/subscriptions/:id — update a subscription
router.put('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (sub.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const allowed = ['name', 'amount', 'category', 'billingCycle', 'nextBillingDate', 'active', 'color', 'icon'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updated = await Subscription.updateById(req.params.id, updates);
    res.json({ subscription: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscription' });
  }
});

// DELETE /api/subscriptions/:id — delete a subscription
router.delete('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (sub.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await Subscription.deleteById(req.params.id);
    res.json({ message: 'Subscription deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete subscription' });
  }
});

module.exports = router;
