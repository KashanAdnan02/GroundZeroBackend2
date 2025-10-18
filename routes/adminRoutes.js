const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const User = require("../models/User");
const { requireAdmin } = require("../middleware");

router.use(requireAdmin);
router.get("/allbooking", async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user_id")
      .populate("facility_id")
      .populate("site_id");

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting all bookings",
      error: error.message,
    });
  }
});

router.get("/facilities", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, site_id, sport } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { facility_id: { $regex: search, $options: "i" } },
        ],
      };
    }
    if (site_id) {
      query.site_id = site_id;
    }
    if (sport) {
      query["sports.sport"] = sport;
    }

    const facilities = await Facility.find(query)
      .populate("site_id", "site_name site_id location")
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Facility.countDocuments(query);

    res.json({
      success: true,
      data: facilities,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching facilities",
      error: error.message,
    });
  }
});

router.get('/sites', async (req, res) => {  
  try {
    const { page = 1, limit = 10, search, featured } = req.query;
    
    let query = {  };
    if (search) {
      query = {
        ...query,
        $or: [
          { site_name: { $regex: search, $options: 'i' } },
          { site_id: { $regex: search, $options: 'i' } },
          { 'site_address.city': { $regex: search, $options: 'i' } },
          { 'site_address.state': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const sites = await Site.find(query)
      .populate('facilities', 'facility_id name sports weekly_slots')
      .sort({ site_name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Site.countDocuments(query);

    res.json({
      success: true,
      data: sites,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sites',
      error: error.message
    });
  }
});

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});
module.exports =  router