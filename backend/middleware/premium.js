const User = require('../models/User');

async function attachPremiumStatus(req, res, next) {
  try {
    const user = await User.Model.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.isPremium = user.checkPremium();
    req.premiumUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requirePremium(req, res, next) {
  if (!req.isPremium) {
    return res.status(403).json({ message: 'Premium subscription required', code: 'PREMIUM_REQUIRED' });
  }
  next();
}

module.exports = { attachPremiumStatus, requirePremium };
