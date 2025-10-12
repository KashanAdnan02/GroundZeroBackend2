const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, setTokenHeaders, setCookieToken } = require('../utils');

router.post('/verify', async (req, res) => {
  try {
    const { code, type } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    const user = await User.findOne({
      verificationCode: code,
      verificationType: type || 'email',
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    user.isActive = true;
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    setTokenHeaders(res, token);
    setCookieToken(res, token);

    res.json({
      success: true,
      message: 'Account verified successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during verification',
      error: error.message
    });
  }
});

module.exports = router;