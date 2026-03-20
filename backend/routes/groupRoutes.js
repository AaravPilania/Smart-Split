const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup,
  getGroups,
  getGroup,
  addMembers,
  deleteGroup
} = require('../controllers/groupController');

router.post('/', auth, createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, getGroup);
router.post('/:id/members', auth, addMembers);
router.delete('/:id', auth, deleteGroup);

module.exports = router;
