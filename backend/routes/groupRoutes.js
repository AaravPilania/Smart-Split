const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createGroupSchema } = require('../validators/groupSchema');
const {
  createGroup,
  getGroups,
  getGroup,
  addMembers,
  deleteGroup
} = require('../controllers/groupController');

router.post('/', auth, validate(createGroupSchema), createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, getGroup);
router.post('/:id/members', auth, addMembers);
router.delete('/:id', auth, deleteGroup);

module.exports = router;
