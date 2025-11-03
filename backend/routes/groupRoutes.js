const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroup,
  addMembers
} = require('../controllers/groupController');

// Create group
router.post('/', createGroup);

// Get all groups (requires userId query param)
router.get('/', getGroups);

// Get single group
router.get('/:id', getGroup);

// Add members to group
router.post('/:id/members', addMembers);

module.exports = router;
