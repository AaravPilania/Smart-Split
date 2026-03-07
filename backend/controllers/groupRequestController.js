const GroupRequest = require('../models/GroupRequest');
const Group = require('../models/Group');
const User = require('../models/User');

// Create group request
exports.createRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body; // User requesting to join

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member._id.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Check if request already exists
    const existingRequest = await GroupRequest.findPendingByGroupAndUser(groupId, userId);
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists' });
    }

    // Create request
    const request = await GroupRequest.create(groupId, userId);

    res.status(201).json({
      message: 'Group request created successfully',
      request: {
        id: request._id,
        group: {
          id: request.group._id,
          name: request.group.name
        },
        user: {
          id: request.user._id,
          name: request.user.name,
          email: request.user.email
        },
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a group (for group admins)
exports.getGroupRequests = async (req, res) => {
  try {
    const { groupId } = req.params;

    const requests = await GroupRequest.findPendingByGroup(groupId);

    const formattedRequests = requests.map(request => ({
      id: request._id,
      group: {
        id: request.group._id,
        name: request.group.name
      },
      user: {
        id: request.user._id,
        name: request.user.name,
        email: request.user.email
      },
      status: request.status,
      createdAt: request.createdAt
    }));

    res.json({ requests: formattedRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get requests for a user (requests they sent)
exports.getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await GroupRequest.findByUser(userId);

    const formattedRequests = requests.map(request => ({
      id: request._id,
      group: {
        id: request.group._id,
        name: request.group.name,
        description: request.group.description,
        createdBy: {
          id: request.group.createdBy._id,
          name: request.group.createdBy.name
        }
      },
      user: {
        id: request.user._id,
        name: request.user.name,
        email: request.user.email
      },
      status: request.status,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt
    }));

    res.json({ requests: formattedRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve group request
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get request
    const request = await GroupRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Add user to group
    await Group.addMember(request.group._id, request.user._id);

    // Update request status
    const updatedRequest = await GroupRequest.approve(requestId);

    res.json({
      message: 'Request approved successfully',
      request: {
        id: updatedRequest._id,
        status: updatedRequest.status,
        respondedAt: updatedRequest.respondedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject group request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get request
    const request = await GroupRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    const updatedRequest = await GroupRequest.reject(requestId);

    res.json({
      message: 'Request rejected successfully',
      request: {
        id: updatedRequest._id,
        status: updatedRequest.status,
        respondedAt: updatedRequest.respondedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

