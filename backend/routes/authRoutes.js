const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authSchema');
const { signup, login, googleAuth, getProfile, updateProfile, getDashboardSummary, refreshToken, logout, sendOtp } = require('../controllers/authController');

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

module.exports = router;
