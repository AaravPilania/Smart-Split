const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile/:userId', getProfile);

// Protected routes
router.put('/profile/:userId', auth, updateProfile);

module.exports = router;
