const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authSchema');
const { signup, login, googleAuth, getProfile, updateProfile, getDashboardSummary, refreshToken, logout, sendOtp } = require('../controllers/authController');
const User = require('../models/User');

// Public routes
router.post('/send-otp', sendOtp);
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/google', googleAuth);
router.get('/profile/:userId', getProfile);

// Token management — /refresh reads httpOnly cookie, no auth header needed
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.put('/profile/:userId', auth, updateProfile);
router.get('/dashboard/summary', auth, getDashboardSummary);

// GET /api/auth/premium-status
router.get('/premium-status', auth, async (req, res) => {
  try {
    const user = await User.Model.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isPremium = user.checkPremium();
    const ocrStatus = user.canUseOcr();
    res.json({
      isPremium,
      premiumExpiry: user.premiumExpiry,
      ocr: ocrStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/toggle-premium — admin/dev toggle (no payment gateway yet)
router.post('/toggle-premium', auth, async (req, res) => {
  try {
    const user = await User.Model.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { isPremium, days } = req.body;
    user.isPremium = isPremium !== undefined ? isPremium : !user.isPremium;
    if (user.isPremium) {
      user.premiumExpiry = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);
    } else {
      user.premiumExpiry = null;
    }
    await user.save();
    res.json({ isPremium: user.isPremium, premiumExpiry: user.premiumExpiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
