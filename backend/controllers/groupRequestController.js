const Group = require('../models/Group');
const GroupRequest = require('../models/GroupRequest');

// Create group request
exports.createRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    const isMember = await Group.isMember(groupId, userId);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if pending request already exists
    const existing = await GroupRequest.findOne({
      group: groupId,
      user: userId,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    await GroupRequest.createRequest(groupId, userId);

    res.status(201).json({ message: 'Group request created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a group (for group admins)
exports.getGroupRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requests = await GroupRequest.findByGroup(groupId);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a user (requests they sent)
exports.getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await GroupRequest.findByUser(userId);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve group request
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await GroupRequest.approveRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject group request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await GroupRequest.rejectRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};