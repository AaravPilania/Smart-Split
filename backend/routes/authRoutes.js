const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { signup, login, getProfile, updateProfile, getDashboardSummary } = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile/:userId', auth, getProfile);

// Protected routes
router.put('/profile/:userId', auth, updateProfile);
router.get('/dashboard/summary', auth, getDashboardSummary);

module.exports = router;
