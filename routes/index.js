const express = require("express");
const router = express.Router();

// Import individual route modules
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

// Mount routes
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

// Health check route
router.get("/", (req, res) => {
  res.json({
    message: "CRUD API Server is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      profile: "/api/profile",
      verification: "/api/verification",
      users: "/api/users",
      sites: "/api/sites",
      facilities: "/api/facilities",
      bookings: "/api/bookings",
    },
  });
});

module.exports = router;
