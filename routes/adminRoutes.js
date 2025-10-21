const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const User = require("../models/User");
const { requireAdmin } = require("../middleware");
const Payment = require("../models/Payment");

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

router.get("/sites", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, featured } = req.query;

    let query = {};
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

router.get("/users", async (req, res) => {
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
router.post("/create/free", async (req, res) => {
  try {
    const {
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
module.exports = router;
