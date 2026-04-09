const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createGroupSchema } = require('../validators/groupSchema');
const {
  createGroup,
  getGroups,
  getGroup,
  addMembers,
  deleteGroup,
  updateGroupPfp,
  archiveGroup
} = require('../controllers/groupController');

router.post('/', auth, validate(createGroupSchema), createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, requireGroupMember, getGroup);
router.post('/:id/members', auth, requireGroupMember, addMembers);
router.patch('/:id/pfp', auth, requireGroupMember, updateGroupPfp);
router.patch('/:id/archive', auth, requireGroupMember, archiveGroup);
router.delete('/:id', auth, requireGroupMember, deleteGroup);

module.exports = router;
