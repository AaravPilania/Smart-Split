const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRequest,
  getGroupRequests,
  getUserRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/groupRequestController');

router.post('/group/:groupId/request', auth, createRequest);
router.get('/group/:groupId/requests', auth, getGroupRequests);
router.get('/user/:userId/requests', auth, getUserRequests);
router.post('/request/:requestId/approve', auth, approveRequest);
router.post('/request/:requestId/reject', auth, rejectRequest);

module.exports = router;
