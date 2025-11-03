const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');

// Signup
router.post('/signup', signup);

// Login
router.post('/login', login);

// Get user profile
router.get('/profile/:userId', getProfile);

// Update user profile
router.put('/profile/:userId', updateProfile);

module.exports = router;
