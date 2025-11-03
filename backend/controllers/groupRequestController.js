const Group = require('../models/Group');
const User = require('../models/User');
const { getPool } = require('../config/database');

// Create group request
exports.createRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body; // User requesting to join

    const pool = getPool();

    // Check if group exists
    const group = await Group.findById(parseInt(groupId));
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    const isMember = await Group.isMember(parseInt(groupId), parseInt(userId));
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if request already exists
    const [existing] = await pool.execute(
      'SELECT id FROM group_requests WHERE group_id = ? AND user_id = ? AND status = ?',
      [groupId, userId, 'pending']
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    // Create request
    await pool.execute(
      'INSERT INTO group_requests (group_id, user_id, status) VALUES (?, ?, ?)',
      [groupId, userId, 'pending']
    );

    res.status(201).json({ message: 'Group request created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a group (for group admins)
exports.getGroupRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const pool = getPool();

    const [requests] = await pool.execute(
      `SELECT gr.*, u.id as user_id, u.name, u.email, g.name as group_name
       FROM group_requests gr
       INNER JOIN users u ON gr.user_id = u.id
       INNER JOIN \`groups\` g ON gr.group_id = g.id
       WHERE gr.group_id = ? AND gr.status = 'pending'
       ORDER BY gr.created_at DESC`,
      [groupId]
    );

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a user (requests they sent)
exports.getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getPool();

    const [requests] = await pool.execute(
      `SELECT gr.*, g.id as group_id, g.name as group_name, g.description,
       g.created_by, u.name as creator_name
       FROM group_requests gr
       INNER JOIN \`groups\` g ON gr.group_id = g.id
       LEFT JOIN users u ON g.created_by = u.id
       WHERE gr.user_id = ?
       ORDER BY gr.created_at DESC`,
      [userId]
    );

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve group request
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const pool = getPool();

    // Get request
    const [requests] = await pool.execute(
      'SELECT * FROM group_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Add user to group
    await Group.addMember(request.group_id, request.user_id);

    // Update request status
    await pool.execute(
      'UPDATE group_requests SET status = ?, responded_at = NOW() WHERE id = ?',
      ['approved', requestId]
    );

    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject group request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const pool = getPool();

    // Get request
    const [requests] = await pool.execute(
      'SELECT * FROM group_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    await pool.execute(
      'UPDATE group_requests SET status = ?, responded_at = NOW() WHERE id = ?',
      ['rejected', requestId]
    );

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

