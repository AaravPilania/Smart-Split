const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/goals — list user's goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findByUser(req.user.id);
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

// POST /api/goals — create a goal
router.post('/', async (req, res) => {
  try {
    const { title, targetAmount, monthlyBudget, deadline } = req.body;
    if (!title || !targetAmount || !monthlyBudget) {
      return res.status(400).json({ message: 'Title, target amount, and monthly budget are required' });
    }
    const goal = await Goal.create({
      user: req.user.id,
      title: String(title).slice(0, 100),
      targetAmount: Number(targetAmount),
      monthlyBudget: Number(monthlyBudget),
      deadline: deadline ? new Date(deadline) : undefined,
    });
    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — update a goal
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const allowed = ['title', 'targetAmount', 'monthlyBudget', 'savedAmount', 'deadline', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updated = await Goal.updateById(req.params.id, updates);
    res.json({ goal: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id — delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await Goal.deleteById(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete goal' });
  }
});

module.exports = router;
