const Group = require('../models/Group');

// Create group (regular, trip, home, or couple)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, createdBy, type, startDate, endDate, budget, budgetCurrency, defaultCurrency, recurringBills } = req.body;

    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy is required' });
    }

    const group = await Group.createGroup(name, description, createdBy);

    const mongoose = require('mongoose');
    const updateFields = {};

    if (type === 'trip') {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Trip groups require start and end dates' });
      }
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      updateFields.type = 'trip';
      updateFields.startDate = new Date(startDate);
      updateFields.endDate = new Date(endDate);
      updateFields.budget = budget || 0;
      updateFields.budgetCurrency = budgetCurrency || 'INR';
    } else if (type === 'home') {
      updateFields.type = 'home';
      if (Array.isArray(recurringBills) && recurringBills.length > 0) {
        updateFields.recurringBills = recurringBills.map(b => ({
          name: b.name?.trim() || 'Bill',
          amount: Number(b.amount) || 0,
          billingDay: Math.min(28, Math.max(1, Number(b.billingDay) || 1)),
          category: b.category || 'utilities',
          active: b.active !== false,
          lastGeneratedMonth: '',
        }));
      }
    } else if (type === 'couple') {
      updateFields.type = 'couple';
    }

    if (defaultCurrency) updateFields.defaultCurrency = defaultCurrency;

    if (Object.keys(updateFields).length > 0) {
      await mongoose.model('Group').findByIdAndUpdate(group.id, updateFields);
    }

    const updatedGroup = await Group.findByIdPopulated(group.id);
    res.status(201).json({ message: 'Group created successfully', group: updatedGroup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const { userId, all, archived } = req.query;

    if (all === 'true') {
      const groups = await Group.findAll();
      return res.json({ groups });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (archived === 'true') {
      const groups = await Group.findArchivedByUser(userId);
      return res.json({ groups });
    }

    const groups = await Group.findActiveByUser(userId);
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

// Update group photo (any member can update)
exports.updateGroupPfp = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = await Group.isMember(req.params.id, req.user.id);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group' });

    const { pfp } = req.body;
    if (!pfp) return res.status(400).json({ message: 'pfp is required' });

    const updated = await Group.updatePfp(req.params.id, pfp);
    res.json({ message: 'Group photo updated', group: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive a group (creator or admin only)
exports.archiveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = await Group.isAdmin(req.params.id, req.user.id);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can archive groups' });

    const archived = await Group.archiveGroup(req.params.id);
    res.json({ message: 'Group archived', group: archived });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a recurring bill to a home group
exports.addRecurringBill = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.type !== 'home') return res.status(400).json({ message: 'Recurring bills are only for home groups' });

    const isAdmin = await Group.isAdmin(req.params.id, req.user.id);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can manage recurring bills' });

    const { name, amount, billingDay, category } = req.body;
    const bill = {
      name: (name || 'Bill').trim(),
      amount: Number(amount) || 0,
      billingDay: Math.min(28, Math.max(1, Number(billingDay) || 1)),
      category: category || 'utilities',
      active: true,
      lastGeneratedMonth: '',
    };

    await mongoose.model('Group').findByIdAndUpdate(req.params.id, {
      $push: { recurringBills: bill }
    });

    const updated = await Group.findByIdPopulated(req.params.id);
    res.json({ message: 'Recurring bill added', group: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a recurring bill
exports.removeRecurringBill = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = await Group.isAdmin(req.params.id, req.user.id);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can manage recurring bills' });

    await mongoose.model('Group').findByIdAndUpdate(req.params.id, {
      $pull: { recurringBills: { _id: req.params.billId } }
    });

    const updated = await Group.findByIdPopulated(req.params.id);
    res.json({ message: 'Recurring bill removed', group: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle a recurring bill active/inactive
exports.toggleRecurringBill = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const GroupModel = mongoose.model('Group');
    const group = await GroupModel.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = await Group.isAdmin(req.params.id, req.user.id);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can manage recurring bills' });

    const bill = group.recurringBills.id(req.params.billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.active = !bill.active;
    await group.save();

    const updated = await Group.findByIdPopulated(req.params.id);
    res.json({ message: 'Recurring bill toggled', group: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};