// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { protect } = require('../middlewares/auth');

// Allowed email domains
const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

const isValidEmailDomain = (email) => {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

// --- Helper: Admin Check ---
const checkIsAdmin = (email) => {
  return process.env.ADMIN_EMAIL &&
    email &&
    process.env.ADMIN_EMAIL.toLowerCase().trim() === email.toLowerCase().trim();
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, googleId, avatar, securityQuestion, securityAnswer } = req.body;

    // Validate request
    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields including security question and answer'
      });
    }

    if (!isValidEmailDomain(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Determine Role
    let finalRole = role || 'customer';
    if (checkIsAdmin(email)) {
      finalRole = 'admin';
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,  // Let the model hash it
      phone: phone || '',
      role: finalRole,
      googleId,
      avatar,
      securityQuestion,
      securityAnswer
    });

    const token = jwt.sign(
      { id: user._id, role: finalRole },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: finalRole,
        serviceCategories: user.serviceCategories || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    if (!isValidEmailDomain(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // 🔐 Admin Enforcement Logic
    let finalRole = user.role;
    if (checkIsAdmin(user.email)) {
      finalRole = 'admin';
      // Sync DB
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`👑 Enforced ADMIN role for: ${user.email}`);
      }
    }

    const token = jwt.sign(
      { id: user._id, role: finalRole },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: finalRole,
        serviceCategories: user.serviceCategories || [],
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    // Dynamic Role Check
    if (checkIsAdmin(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role, // Will reflect specific DB update
        serviceCategories: user.serviceCategories || [],
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/auth/update-profile
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, phone, serviceCategories, bio, hourlyRate, isAvailable, role, securityQuestion, securityAnswer } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (serviceCategories) user.serviceCategories = serviceCategories;
    if (bio !== undefined) user.bio = bio;
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (isAvailable !== undefined) user.isAvailable = isAvailable;

    // Prevent accidental demotion of admin via profile update
    if (role && role !== 'admin' && checkIsAdmin(user.email)) {
      // Ignore role change request if it tries to remove admin
    } else if (role) {
      user.role = role;
    }

    if (securityQuestion) user.securityQuestion = securityQuestion;
    if (securityAnswer) user.securityAnswer = securityAnswer; // Will be hashed on save

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        serviceCategories: user.serviceCategories || [],
        isAvailable: user.isAvailable
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// @route   POST /api/auth/forgot-password/init
router.post('/forgot-password/init', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.securityQuestion) {
      return res.status(400).json({
        success: false,
        error: 'Security question not set for this account. Please contact support.'
      });
    }

    res.json({
      success: true,
      securityQuestion: user.securityQuestion
    });

  } catch (error) {
    console.error('Forgot Password Init Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password/verify
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+securityAnswer');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.matchSecurityAnswer(securityAnswer);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect security answer' });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Forgot Password Verify Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE /api/auth/delete-account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during account deletion'
    });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { accessToken, role } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'Access token required' });
    }

    // Verify token with Google
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, name, sub: googleId, picture } = googleRes.data;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google account has no email' });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    // Determine Admin Status
    let finalRole = role || 'customer';
    if (checkIsAdmin(email)) {
      finalRole = 'admin';
    }

    if (user) {
      // User exists - Login
      let roleUpdated = false;

      // Update avatar if missing/changed
      if (!user.avatar && picture) {
        user.avatar = picture;
        if (googleId && !user.googleId) user.googleId = googleId;
        roleUpdated = true;
      }

      // Enforce Admin if needed
      if (checkIsAdmin(user.email) && user.role !== 'admin') {
        user.role = 'admin';
        finalRole = 'admin';
        roleUpdated = true;
      }

      if (roleUpdated) await user.save();

      const token = jwt.sign(
        { id: user._id, role: finalRole },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: finalRole,
          serviceCategories: user.serviceCategories || [],
          createdAt: user.createdAt
        }
      });
    } else {
      // User does not exist - Register
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = await User.create({
        name: name,
        email: email.toLowerCase(),
        password: randomPassword, // Model will hash it
        role: finalRole,
        googleId,
        avatar: picture
      });

      const token = jwt.sign(
        { id: user._id, role: finalRole },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        success: true,
        isNewUser: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: finalRole,
          serviceCategories: [],
          createdAt: user.createdAt
        }
      });
    }

  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed'
    });
  }
});

module.exports = router;