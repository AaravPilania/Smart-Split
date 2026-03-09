const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile/:userId', auth, getProfile);
router.put('/profile/:userId', auth, updateProfile);

module.exports = router;
