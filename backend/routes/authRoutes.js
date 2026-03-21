const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authSchema');
const { signup, login, getProfile, updateProfile, getDashboardSummary } = require('../controllers/authController');

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/profile/:userId', getProfile);

// Protected routes
router.put('/profile/:userId', auth, updateProfile);
router.get('/dashboard/summary', auth, getDashboardSummary);

module.exports = router;
