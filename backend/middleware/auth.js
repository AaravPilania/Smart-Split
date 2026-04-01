const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware: require authenticated user to be a member of the group
 * specified in req.params.groupId. Must be used AFTER auth middleware.
 */
const requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }
    const isMember = await Group.isMember(groupId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a group member to perform this action' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

module.exports = auth;
module.exports.requireGroupMember = requireGroupMember;
