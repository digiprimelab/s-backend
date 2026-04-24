const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register (First admin only) - ✅ Updated with new fields
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, dateOfBirth, userId } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ 
      username, 
      password,
      name: name || { first: '', last: '' },
      email,
      dateOfBirth,
      userId: userId || `ADM${Date.now().toString().slice(-4)}`
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username,
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login - ✅ Updated response with profile data
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // ✅ Return full profile data on login
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username,
        name: user.name,
        email: user.email,
        userId: user.userId,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        isActive: user.isActive
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user - ✅ Already returns full profile (minus password)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: Update admin profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, dateOfBirth } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        userId: user.userId,
        dateOfBirth: user.dateOfBirth
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;