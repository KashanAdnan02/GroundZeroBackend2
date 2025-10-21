const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const { requireSiteManager } = require("../middleware/adminAuth");

router.use(requireSiteManager);

router.post("/allbookings", async (req, res) => {
  try {
    const { site_associated } = req.body; // array of site IDs

    if (!Array.isArray(site_associated) || site_associated.length === 0) {
      return res.status(400).json({
        success: false,
        message: "site_associated must be a non-empty array of IDs",
      });
    }

    // Find all bookings where site_id is one of the IDs in site_associated
    const bookings = await Booking.find({
      site_id: { $in: site_associated },
    })
      .populate("user_id")
      .populate("facility_id")
      .populate("site_id");

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting investor bookings",
      error: error.message,
    });
  }
});

router.post("/allsites", async (req, res) => {
  try {
    const { site_associated } = req.body; // array of site IDs
    if (!Array.isArray(site_associated) || site_associated.length === 0) {
      return res.status(400).json({
        success: false,
        message: "site_associated must be a non-empty array of IDs",
      });
    }

    // Find all bookings where site_id is one of the IDs in site_associated
    const sites = await Site.find({
      _id: { $in: site_associated },
    });

    res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting investor sites",
      error: error.message,
    });
  }
});

router.post("/allfacilities", async (req, res) => {
  try {
    const { site_associated } = req.body; // array of site IDs

    if (!Array.isArray(site_associated) || site_associated.length === 0) {
      return res.status(400).json({
        success: false,
        message: "site_associated must be a non-empty array of IDs",
      });
    }

    // Find all bookings where site_id is one of the IDs in site_associated
    const facility = await Facility.find({
      site_id: { $in: site_associated },
    });

    res.status(200).json({
      success: true,
      count: facility.length,
      data: facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting investor sites",
      error: error.message,
    });
  }
});

router.post("/sites/", async (req, res) => {
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

router.delete("/facilities/:id", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    await Site.findByIdAndUpdate(facility.site_id, {
      $pull: { facilities: req.params.id },
    });

    await Facility.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Facility deleted successfully",
      data: { id: req.params.id, facility_id: facility.facility_id },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid facility ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error deleting facility",
      error: error.message,
    });
  }
});
router.put("/sites/:id", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
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
router.post("/facilities", async (req, res) => {
  try {
    const { site_id, facility_id, name, sports, weekly_slots, booking_rules } =
      req.body;

    const siteExists = await Site.findById(site_id);
    if (!siteExists) {
      return res.status(400).json({
        success: false,
        message: "Site not found",
      });
    }

    const existingFacility = await Facility.findOne({ facility_id });
    if (existingFacility) {
      return res.status(400).json({
        success: false,
        message: "Facility with this ID already exists",
      });
    }

    const facility = new Facility({
      site_id,
      facility_id,
      name,
      sports,
      weekly_slots,
      booking_rules,
    });

    const savedFacility = await facility.save();

    await Site.findByIdAndUpdate(site_id, {
      $push: { facilities: savedFacility._id },
    });

    const populatedFacility = await Facility.findById(
      savedFacility._id
    ).populate("site_id", "site_name site_id");

    res.status(201).json({
      success: true,
      message: "Facility created successfully",
      data: populatedFacility,
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
        message: "Facility ID must be unique",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating facility",
      error: error.message,
    });
  }
});

router.put("/facilities/:id", async (req, res) => {
  try {
    const { site_id, facility_id, name, sports, weekly_slots, booking_rules } =
      req.body;

    let facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    if (site_id) {
      const siteExists = await Site.findById(site_id);
      if (!siteExists) {
        return res.status(400).json({
          success: false,
          message: "Site not found",
        });
      }
    }

    if (facility_id && facility_id !== facility.facility_id) {
      const existingFacility = await Facility.findOne({ facility_id });
      if (existingFacility) {
        return res.status(400).json({
          success: false,
          message: "Facility with this ID already exists",
        });
      }
    }

    const updatedFacility = await Facility.findByIdAndUpdate(
      req.params.id,
      {
        site_id,
        facility_id,
        name,
        sports,
        weekly_slots,
        booking_rules,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("site_id", "site_name site_id");

    res.json({
      success: true,
      message: "Facility updated successfully",
      data: updatedFacility,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid facility ID format",
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
        message: "Facility ID must be unique",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating facility",
      error: error.message,
    });
  }
});

module.exports = router;
