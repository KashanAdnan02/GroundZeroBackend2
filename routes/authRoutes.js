const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const {
  sendEmailVerification,
  sendSMSVerification,
} = require("../services/verificationService");
const {
  generateToken,
  generateVerificationCode,
  calculateVerificationExpiry,
  setCookieToken,
  setTokenHeaders,
  extractToken,
  verifyToken,
} = require("../utils");

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      phone,
      address,
      role,
      verificationType,
    } = req.body;
    const existingUser = await User.findOne({ email });
    if (role == "admin" || role == "investor" || role == "site_manager") {
      return res.status(400).json({
        success: false,
        message: "Shana nahi ban chutiye",
      });
    }
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = generateVerificationCode();
    const verificationExpires = calculateVerificationExpiry();

    const user = new User({
      name: name || "Guest",
      email,
      password: hashedPassword,
      age,
      phone,
      address,
      role: role || "user",
      verificationCode,
      verificationExpires,
      verificationType: verificationType || "email",
      isActive: false,
    });

    const savedUser = await user.save();

    if (verificationType === "phone" && phone) {
      await sendSMSVerification(phone, verificationCode, name || "Guest");
    } else {
      await sendEmailVerification(email, verificationCode, name || "Guest");
    }

    const token = generateToken(savedUser._id);

    setTokenHeaders(res, token);
    setCookieToken(res, token);

    res.status(201).json({
      success: true,
      message: `User registered successfully. Verification code sent to ${
        verificationType === "phone" ? "phone" : "email"
      }.`,
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        isActive: savedUser.isActive,
        avatar: savedUser.avatar,
        verificationType: savedUser.verificationType,
        requiresVerification: true,
      },
      token,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }
    
    res.json({
      success: true,
      message: "Token is valid",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar : user.avatar
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact administrator.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    setTokenHeaders(res, token);
    setCookieToken(res, token);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        site_associated: user.site_associated,
        role: user.role,
        isActive: user.isActive,
        avatar : user.avatar
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
});

module.exports = router;
