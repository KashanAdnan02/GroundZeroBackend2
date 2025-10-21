const express = require("express");
const router = express.Router();
const Site = require("../models/Site");
const { requireAdmin, authenticateUser } = require("../middleware");
const { requireSiteManager } = require("../middleware/adminAuth");

// Public endpoint for customers to view available sites
router.get("/public", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, featured } = req.query;

    let query = { isActive: true }; // Only show active sites to public
    if (search) {
      query = {
        ...query,
        $or: [
          { site_name: { $regex: search, $options: "i" } },
          { site_id: { $regex: search, $options: "i" } },
          { "site_address.city": { $regex: search, $options: "i" } },
          { "site_address.state": { $regex: search, $options: "i" } },
        ],
      };
    }

    const sites = await Site.find(query)
      .populate("facilities", "facility_id name sports weekly_slots")
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
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sites",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
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
          { site_name: { $regex: search, $options: "i" } },
          { site_id: { $regex: search, $options: "i" } },
          { "site_address.city": { $regex: search, $options: "i" } },
          { "site_address.state": { $regex: search, $options: "i" } },
        ],
      };
    }
    const sites = await Site.find(query)
      .populate("facilities", "facility_id name sports")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const total = await Site.countDocuments(query);

    res.json({
      success: true,
      data: sites,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sites",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate(
        "facilities",
        "facility_id name sports booking_rules weekly_slots total_bookings sport_bookings site_id"
      )
      .populate("site_id");
    // .select('-__v');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error fetching site",
      error: error.message,
    });
  }
});

router.get("/by-site-id/:siteId", requireAdmin, async (req, res) => {
  try {
    const site = await Site.findOne({ site_id: req.params.siteId })
      .populate("facilities", "facility_id name sports")
      .select("-__v");

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching site",
      error: error.message,
    });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { site_id, site_name, site_address, isActive } = req.body;

    const existingSite = await Site.findOne({ site_id });
    if (existingSite) {
      return res.status(400).json({
        success: false,
        message: "Site with this Site ID already exists",
      });
    }

    const site = new Site({
      site_id,
      site_name,
      site_address,
      isActive,
    });

    const savedSite = await site.save();

    res.status(201).json({
      success: true,
      message: "Site created successfully",
      data: savedSite,
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Site ID must be unique",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating site",
      error: error.message,
    });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { site_id, site_name, site_address, isActive } = req.body;

    let site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    if (site_id && site_id !== site.site_id) {
      const existingSite = await Site.findOne({ site_id });
      if (existingSite) {
        return res.status(400).json({
          success: false,
          message: "Site with this Site ID already exists",
        });
      }
    }

    const updatedSite = await Site.findByIdAndUpdate(
      req.params.id,
      {
        site_id,
        site_name,
        site_address,
        isActive,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    res.json({
      success: true,
      message: "Site updated successfully",
      data: updatedSite,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format",
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Site ID must be unique",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating site",
      error: error.message,
    });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    await Site.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Site deleted successfully",
      data: { id: req.params.id, site_id: site.site_id },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error deleting site",
      error: error.message,
    });
  }
});


router.patch("/:id/toggle-status", requireAdmin, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    site.isActive = !site.isActive;
    const updatedSite = await site.save();

    res.json({
      success: true,
      message: `Site ${
        updatedSite.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedSite,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error toggling site status",
      error: error.message,
    });
  }
});

module.exports = router;
