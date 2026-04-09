const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Friendship = require('../models/Friendship');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSubscriptionSchema, updateSubscriptionSchema } = require('../validators/subscriptionSchema');

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
router.post('/', validate(createSubscriptionSchema), async (req, res) => {
  try {
    const { name, amount, category, billingCycle, nextBillingDate, color, icon } = req.body;
    const sub = await Subscription.create({
      user: req.user.id,
      name,
      amount,
      category,
      billingCycle,
      nextBillingDate: new Date(nextBillingDate),
      color,
      icon,
    });
    res.status(201).json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// GET /api/subscriptions/shared-with-me — subscriptions others share with me
router.get('/shared-with-me', async (req, res) => {
  try {
    const subs = await Subscription.findSharedWithUser(req.user.id);
    res.json({ subscriptions: subs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch shared subscriptions' });
  }
});

// PUT /api/subscriptions/:id — update a subscription
router.put('/:id', validate(updateSubscriptionSchema), async (req, res) => {
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

// POST /api/subscriptions/:id/share — add friends to share a subscription
router.post('/:id/share', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (sub.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Provide at least one userId' });
    }

    // Validate all are friends
    for (const uid of userIds) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: req.user.id, recipient: uid, status: 'accepted' },
          { requester: uid, recipient: req.user.id, status: 'accepted' },
        ],
      });
      if (!friendship) {
        return res.status(400).json({ message: `User ${uid} is not your friend` });
      }
    }

    const updated = await Subscription.updateById(req.params.id, {
      $addToSet: { sharedWith: { $each: userIds } },
    });
    res.json({ subscription: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to share subscription' });
  }
});

// DELETE /api/subscriptions/:id/share/:userId — remove a partner from subscription
router.delete('/:id/share/:userId', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (sub.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await Subscription.updateById(req.params.id, {
      $pull: { sharedWith: req.params.userId },
    });
    res.json({ subscription: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove partner' });
  }
});

module.exports = router;
