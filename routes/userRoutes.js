const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { requireAdmin, authenticateUser } = require("../middleware");
const {
  sendEmailForAccountCreation,
} = require("../services/verificationService");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const upload = require("../config/image_integration");

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      age,
      phone,
      isVerified,
      address,
      isActive,
      password,
      role,
      site_associated,
      sendMail,
      investmentPercentage,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      name,
      email,
      age,
      phone,
      address,
      role,
      isVerified: isVerified,
      isActive: isActive,
      site_associated: site_associated || undefined,
      password: hashedPassword,
      investmentPercentage,
    });

    const savedUser = await user.save();
    req.io.emit("new_user", {
      type: "user",
      time: new Date().getTime(),
      message: "User created successfully",
      data: savedUser,
    });

    if (sendMail) {
      sendEmailForAccountCreation(email, password, phone, name, role);
    }
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
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
      message: "Error creating user",
      error: error.message,
    });
  }
});

router.put(
  "/:id/avatar",
  authenticateUser,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      if (req.user._id.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_avatars",
        resource_type: "image",
      });
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Failed to delete temp file:", err.message);
      });

      if (user.avatar && user.avatar.includes("res.cloudinary.com")) {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`user_avatars/${publicId}`);
        } catch (err) {
          console.warn("Failed to delete old image:", err.message);
        }
      }

      user.avatar = uploadResult.secure_url;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatar: uploadResult.secure_url,
          userId: user._id,
        },
      });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      res.status(500).json({
        success: false,
        message: "Avatar upload failed",
        error: error.message,
      });
    }
  }
);

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      age,
      phone,
      address,
      isActive,
      role,
      investmentPercentage,
      site_associated,
    } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        age,
        phone,
        address,
        isActive,
        role,
        investmentPercentage,
        site_associated,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
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
      message: "Error updating user",
      error: error.message,
    });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

module.exports = router;
