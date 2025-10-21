const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { sendEmailVerification } = require('../services/verificationService');
const { extractToken, verifyToken, generateVerificationCode, calculateVerificationExpiry } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id).select('-password -__v');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error.',
      error: error.message
    });
  }
});

router.put('/update-profile', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    const { name, email, phone, address, currentPassword, newPassword } = req.body;

    let emailChanged = false;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      emailChanged = true;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const userWithPassword = await User.findById(decoded.id).select('+password');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedNewPassword;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    if (emailChanged) {
      const verificationCode = generateVerificationCode();
      const verificationExpires = calculateVerificationExpiry();
      
      user.email = email;
      user.isVerified = false;
      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      user.verificationType = 'email';
      
      await user.save();
      
      await sendEmailVerification(email, verificationCode, user.name);
    } else {
      await user.save();
    }

    res.json({
      success: true,
      message: emailChanged ? 'Profile updated successfully. Verification code sent to new email address.' : 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        requiresVerification: emailChanged
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

router.post('/deactivate', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    const user = await User.findById(decoded.id).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = reason || 'User requested';
    await user.save();

    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deactivating account',
      error: error.message
    });
  }
});

router.post('/logout', (req, res) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
});

module.exports = router;