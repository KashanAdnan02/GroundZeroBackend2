const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const verificationRoutes = require("./verificationRoutes");
const userRoutes = require("./userRoutes");
const siteRoutes = require("./siteRoutes");
const facilityRoutes = require("./facilityRoutes");
const bookingRoutes = require("./bookingRoutes");
const paymentRoutes = require("./paymentRoutes");
const adminRoutes = require("./adminRoutes");
const siteManagerRoutes = require("./siteManagerRoutes");

router.use("/site_manager", siteManagerRoutes);
router.use("/admin", adminRoutes);
router.use("/pay", paymentRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/verification", verificationRoutes);
router.use("/users", userRoutes);
router.use("/sites", siteRoutes);
router.use("/facilities", facilityRoutes);
router.use("/bookings", bookingRoutes);

router.get("/", (req, res) => {
  res.json({
    message: "Ground Zero Server!"
  });
});

module.exports = router;
