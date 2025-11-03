const express = require('express');
const router = express.Router();
const {
  createRequest,
  getGroupRequests,
  getUserRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/groupRequestController');

// Create group request
router.post('/group/:groupId/request', createRequest);

// Get requests for a group
router.get('/group/:groupId/requests', getGroupRequests);

// Get requests for a user
router.get('/user/:userId/requests', getUserRequests);

// Approve request
router.post('/request/:requestId/approve', approveRequest);

// Reject request
router.post('/request/:requestId/reject', rejectRequest);

module.exports = router;

