const express = require("express");
const router = express.Router();
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const { requireAdmin, authenticateUser } = require("../middleware");

// Public endpoint for customers to view available facilities
router.get("/public", async (req, res) => {
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

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      site_id,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

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

    const facilities = await Facility.find(query)
      .populate("site_id", "site_name site_id")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
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

router.get("/:id", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).populate(
      "site_id",
      "site_name site_id site_address "
    );

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    res.json({
      success: true,
      data: facility,
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
      message: "Error fetching facility",
      error: error.message,
    });
  }
});

router.get("/by-facility-id/:facilityId", async (req, res) => {
  try {
    const facility = await Facility.findOne({
      facility_id: req.params.facilityId,
    }).populate("site_id", "site_name site_id");

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    res.json({
      success: true,
      data: facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching facility",
      error: error.message,
    });
  }
});

router.use(requireAdmin);
router.post("/", async (req, res) => {
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

router.put("/:id", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
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

router.get("/site/:siteId", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = { site_id: req.params.siteId };
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { facility_id: { $regex: search, $options: "i" } },
        ],
      };
    }

    const facilities = await Facility.find(query)
      .populate("site_id", "site_name site_id")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
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
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error fetching facilities for site",
      error: error.message,
    });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { operation, data } = req.body;

    if (operation === "create") {
      const facilities = await Facility.insertMany(data, { ordered: false });

      const siteUpdates = {};
      facilities.forEach((facility) => {
        if (!siteUpdates[facility.site_id]) {
          siteUpdates[facility.site_id] = [];
        }
        siteUpdates[facility.site_id].push(facility._id);
      });

      for (const [siteId, facilityIds] of Object.entries(siteUpdates)) {
        await Site.findByIdAndUpdate(siteId, {
          $push: { facilities: { $each: facilityIds } },
        });
      }

      const populatedFacilities = await Facility.find({
        _id: { $in: facilities.map((f) => f._id) },
      }).populate("site_id", "site_name site_id");
      res.status(201).json({
        success: true,
        message: `${facilities.length} facilities created successfully`,
        data: populatedFacilities,
      });
    } else if (operation === "delete") {
      const facilitiesToDelete = await Facility.find({ _id: { $in: data } });

      const siteUpdates = {};
      facilitiesToDelete.forEach((facility) => {
        if (!siteUpdates[facility.site_id]) {
          siteUpdates[facility.site_id] = [];
        }
        siteUpdates[facility.site_id].push(facility._id);
      });

      for (const [siteId, facilityIds] of Object.entries(siteUpdates)) {
        await Site.findByIdAndUpdate(siteId, {
          $pull: { facilities: { $in: facilityIds } },
        });
      }

      const result = await Facility.deleteMany({ _id: { $in: data } });
      res.json({
        success: true,
        message: `${result.deletedCount} facilities deleted successfully`,
        deletedCount: result.deletedCount,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid bulk operation. Supported: create, delete",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error performing bulk operation",
      error: error.message,
    });
  }
});

// Get facility booking statistics
router.get("/:id/booking-stats", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .select("facility_id name total_bookings sport_bookings")
      .populate("site_id", "site_name");

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    res.json({
      success: true,
      data: {
        facility_id: facility.facility_id,
        facility_name: facility.name,
        site_name: facility.site_id.site_name,
        total_bookings: facility.total_bookings || 0,
        sport_bookings: facility.sport_bookings || [],
        booking_summary: facility.sport_bookings.map((sb) => ({
          sport: sb.sport,
          booking_count: sb.booking_count,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching booking statistics",
      error: error.message,
    });
  }
});

module.exports = router;
