const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendRequest,
  getFriends,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  removeFriend,
} = require('../controllers/friendController');

router.post('/request/:recipientId', auth, sendRequest);
router.get('/', auth, getFriends);
router.get('/requests', auth, getIncomingRequests);
router.patch('/accept/:friendshipId', auth, acceptRequest);
router.patch('/reject/:friendshipId', auth, rejectRequest);
router.delete('/:friendId', auth, removeFriend);

module.exports = router;
