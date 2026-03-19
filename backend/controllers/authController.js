const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // findByEmail with true = include password hash
    const user = await User.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, password, username, pfp, currentPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailTaken = await User.findByEmail(email);
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if username is being changed and if it's already taken
    if (username && username.toLowerCase().trim() !== user.username) {
      const usernameTaken = await User.findByUsername(username);
      if (usernameTaken && usernameTaken.id?.toString() !== userId?.toString()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Require current password verification when changing password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const userWithPwd = await User.findByEmail(user.email, true);
      const isMatch = await User.comparePassword(currentPassword, userWithPwd.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    const updatedUser = await User.updateById(userId, { name, email, password, username, pfp });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        pfp: updatedUser.pfp || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};