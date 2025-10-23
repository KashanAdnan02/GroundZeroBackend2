const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const { requireSiteManager } = require("../middleware/adminAuth");
const Payment = require("../models/Payment");
const User = require("../models/User");

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

router.post("/create/free", async (req, res) => {
  try {
    let {
      facility_id,
      sport,
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      booking_status,
      payment_status,
      payment_method,
      notes,
      equipment_used,
    } = req.body;

    const facility = await Facility.findById(facility_id).populate("site_id");
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    const sportInfo = facility.sports.find((s) => s.sport === sport);
    if (!sportInfo) {
      return res.status(400).json({
        success: false,
        message: "Sport not available at this facility",
      });
    }

    let totalAmount = sportInfo.base_price;

    if (equipment_used && equipment_used.length > 0) {
      equipment_used.forEach((eq) => {
        totalAmount += eq.cost * eq.quantity;
      });
    }
    if (Number(duration_minutes) === 120 || Number(duration_minutes) === 180) {
      const toAdd = Number(duration_minutes) === 120 ? 1 : 2;
      end_time = `${Number(end_time.split(":")[0]) + toAdd}:${
        end_time.split(":")[1]
      }`;
    }

    const [hourStr, minute] = end_time.split(":");
    let hour = Number(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    end_time = `${hour}:${minute.split(" ")[0]} ${ampm}`;
    const bookings = await Booking.find(
      {},
      "booking_status start_time end_time booking_date"
    );
    bookings.forEach((b) => {
      if (b.end_time == end_time && b.start_time == start_time) {
        return res.status(400).json({
          success: false,
          message: "The time is booked for another booking!",
        });
      } else if (b.end_time == end_time) {
        return res.status(400).json({
          success: false,
          message: "The booking cannot be for two hours",
        });
      }
    });
    const booking = new Booking({
      start_time,
      end_time: end_time,
      booking_id: generateBookingId(),
      user_id: req.user._id,
      facility_id,
      site_id: facility.site_id._id,
      sport,
      booking_date: booking_date,
      duration_minutes,
      total_amount: totalAmount,
      payment_method,
      payment_status,
      booking_status,
      notes,
      equipment_used: equipment_used || [],
    });
    const savedBooking = await booking.save();
    const payment = new Payment({
      userId: req.user._id,
      facilityId: facility._id,
      bookingId: savedBooking._id,
      sport: sport,
      site: facility.site_id._id,
      amount: totalAmount,
      currency: "INR",
      paymentMethod: payment_method,
      status: "pending",
      transactionId: `txn_${savedBooking.booking_id}`,
      paidAt: null,
      bookingId: savedBooking._id,
    });

    await payment.save();
    await User.findByIdAndUpdate(req.user._id, {
      $push: { my_bookings: savedBooking._id },
    });
    await Facility.findByIdAndUpdate(
      facility_id,
      {
        $inc: { total_bookings: 1 },
        $set: {
          [`sport_bookings.$[elem].booking_count`]: 1,
        },
      },
      {
        arrayFilters: [{ "elem.sport": sport }],
        upsert: false,
      }
    );
    const facilityUpdate = await Facility.findById(facility_id);
    const sportExists = facilityUpdate.sport_bookings.some(
      (sb) => sb.sport === sport
    );
    if (!sportExists) {
      await Facility.findByIdAndUpdate(facility_id, {
        $push: {
          sport_bookings: {
            sport: sport,
            booking_count: 1,
          },
        },
      });
    } else {
      await Facility.findByIdAndUpdate(
        facility_id,
        {
          $inc: {
            "sport_bookings.$[elem].booking_count": 1,
          },
        },
        {
          arrayFilters: [{ "elem.sport": sport }],
        }
      );
    }

    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate("facility_id", "facility_id name sports")
      .populate("site_id", "site_name site_address")
      .populate("user_id", "name email phone");
    req.io.emit("new_booking", {
      type: "booking",
      time: new Date().getTime(),
      message: "Booking created successfully",
      data: populatedBooking,
    });
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking,
      payment: payment._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
});

router.delete("/booking/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    console.log(booking.user_id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Remove payment associated with this booking
    await Payment.findOneAndDelete({ bookingId });

    // Decrement facility and sport booking counts
    await Facility.findByIdAndUpdate(
      booking.facility_id,
      {
        $inc: { total_bookings: -1 },
      },
      { new: true }
    );

    await Facility.findByIdAndUpdate(
      booking.facility_id,
      {
        $inc: { "sport_bookings.$[elem].booking_count": -1 },
      },
      {
        arrayFilters: [{ "elem.sport": booking.sport }],
      }
    );

    // Remove booking from user's my_bookings list
    await User.findByIdAndUpdate(booking.user_id, {
      $pull: { my_bookings: booking._id },
    });

    // Delete the booking itself
    await Booking.findByIdAndDelete(bookingId);

    // Emit a socket event
    req.io.emit("booking_deleted", {
      type: "booking",
      time: new Date().getTime(),
      message: "Booking deleted successfully",
      data: booking,
    });

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting booking",
      error: error.message,
    });
  }
});

router.put(
  "/update/:bookingId",
  requireSiteManager,
  async (req, res) => {
    try {
      const {
        facility_id,
        sport,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        payment_method,
        notes,
        equipment_used,
        payment_status,
        booking_status,
      } = req.body;

      const bookingId = req.params.bookingId;

      // Find the existing booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Find facility
      const facility = await Facility.findById(facility_id).populate("site_id");
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Facility not found",
        });
      }

      const sportInfo = facility.sports.find((s) => s.sport === sport);
      if (!sportInfo) {
        return res.status(400).json({
          success: false,
          message: "Sport not available at this facility",
        });
      }

      // Calculate total amount again
      let totalAmount = sportInfo.base_price;
      if (equipment_used && equipment_used.length > 0) {
        equipment_used.forEach((eq) => {
          totalAmount += eq.cost * eq.quantity;
        });
      }

      // Update booking fields
      booking.facility_id = facility_id;
      booking.site_id = facility.site_id._id;
      booking.sport = sport;
      booking.booking_date = booking_date;
      booking.start_time = start_time;
      booking.end_time = end_time;
      booking.duration_minutes = duration_minutes;
      booking.payment_method = payment_method;
      booking.notes = notes;
      booking.total_amount = totalAmount;
      booking.booking_status = booking_status;
      booking.payment_status = payment_status;
      booking.equipment_used = equipment_used || [];

      const updatedBooking = await booking.save();

      // Update payment info
      await Payment.findOneAndUpdate(
        { bookingId: updatedBooking._id },
        {
          $set: {
            amount: totalAmount,
            paymentMethod: payment_method,
          },
        }
      );

      const populatedBooking = await Booking.findById(updatedBooking._id)
        .populate("facility_id", "facility_id name sports")
        .populate("site_id", "site_name site_address")
        .populate("user_id", "name email phone");

      // Emit socket event for live updates
      req.io.emit("booking_updated", {
        type: "booking",
        time: new Date().getTime(),
        message: "Booking updated successfully",
        data: populatedBooking,
      });

      res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: populatedBooking,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating booking",
        error: error.message,
      });
    }
  }
);
module.exports = router;
