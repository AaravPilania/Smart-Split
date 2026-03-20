const Group = require('../models/Group');

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy is required' });
    }

    const group = await Group.createGroup(name, description, createdBy);

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const { userId, all } = req.query;

    // If 'all' parameter is true, return all groups (for discovery)
    if (all === 'true') {
      const groups = await Group.findAll();
      return res.json({ groups });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const groups = await Group.findByUser(userId);

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single group
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findByIdPopulated(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add members to group
exports.addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body;
    const groupId = req.params.id;

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'memberIds must be an array' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can add members' });
    }

    const updatedGroup = await Group.addMembers(groupId, memberIds);

    res.json({
      message: 'Members added successfully',
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete group (creator only, cascades expenses + payments)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    const Expense = require('../models/Expense');
    const Payment = require('../models/Payment');
    await Expense.deleteByGroup(req.params.id);
    await Payment.deleteByGroup(req.params.id);
    await Group.deleteById(req.params.id);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};