const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const Site = require("../models/Site");
const User = require("../models/User");
const { authenticateUser } = require("../middleware");
const { generateBookingId } = require("../utils");
const Payment = require("../models/Payment");

router.use(authenticateUser);

const checkTimeSlotAvailability = async (
  facilityId,
  startTime,
  endTime,
  excludeBookingId = null
) => {
  const query = {
    facility_id: facilityId,
    booking_status: { $in: ["confirmed", "active"] },
    $or: [
      {
        start_time: { $lt: endTime },
        end_time: { $gt: startTime },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await Booking.find(query);
  return conflictingBookings.length === 0;
};
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

router.post("/create", async (req, res) => {
  try {
    const {
      facility_id,
      sport,
      booking_date,
      start_time,
      duration_minutes,
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

    const startDateTime = new Date(start_time);
    const endDateTime = new Date(
      startDateTime.getTime() + duration_minutes * 60000
    );

    const isAvailable = await checkTimeSlotAvailability(
      facility_id,
      startDateTime,
      endDateTime
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Time slot not available",
      });
    }

    let totalAmount = sportInfo.base_price;

    if (equipment_used && equipment_used.length > 0) {
      equipment_used.forEach((eq) => {
        totalAmount += eq.cost * eq.quantity;
      });
    }

    const booking = new Booking({
      booking_id: generateBookingId(),
      user_id: req.user._id,
      facility_id,
      site_id: facility.site_id._id,
      sport,
      booking_date: booking_date,
      start_time: startDateTime,
      end_time: endDateTime,
      duration_minutes,
      total_amount: totalAmount,
      payment_method,
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
      type : "booking",
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

router.get("/my-bookings", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;

    let query = { user_id: req.user._id };

    if (status) {
      query.booking_status = status;
    }

    if (upcoming === "true") {
      query.start_time = { $gte: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate("facility_id", "facility_id name sports")
      .populate("site_id", "site_name site_address")
      .sort({ start_time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("facility_id", "facility_id name sports")
      .populate("site_id", "site_name site_address")
      .populate("user_id", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
});

router.post("/:id/check-in", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!booking.canCheckIn()) {
      return res.status(400).json({
        success: false,
        message:
          "Check-in not allowed at this time or booking not confirmed/paid",
      });
    }

    booking.check_in_time = new Date();
    booking.booking_status = "active";
    await booking.save();

    res.json({
      success: true,
      message: "Checked in successfully",
      data: {
        booking_id: booking.booking_id,
        check_in_time: booking.check_in_time,
        status: booking.booking_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during check-in",
      error: error.message,
    });
  }
});

router.post("/:id/check-out", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!booking.canCheckOut()) {
      return res.status(400).json({
        success: false,
        message: "Check-out not allowed or not checked in",
      });
    }

    booking.check_out_time = new Date();
    booking.booking_status = "completed";
    booking.actual_duration = booking.calculateActualDuration();

    if (booking.isOverdue()) {
      const overdueMinutes = Math.ceil(
        (booking.check_out_time - booking.end_time) / (1000 * 60)
      );
      booking.late_fee = overdueMinutes * 5;
    }

    await booking.save();

    res.json({
      success: true,
      message: "Checked out successfully",
      data: {
        booking_id: booking.booking_id,
        check_out_time: booking.check_out_time,
        actual_duration: booking.actual_duration,
        late_fee: booking.late_fee,
        status: booking.booking_status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during check-out",
      error: error.message,
    });
  }
});

router.post("/:id/cancel", async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (booking.booking_status === "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel active booking. Please check out first.",
      });
    }

    if (
      booking.booking_status === "completed" ||
      booking.booking_status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking already completed or cancelled",
      });
    }

    const now = new Date();
    const hoursUntilStart = (booking.start_time - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilStart >= 24) {
      refundPercentage = 100;
    } else if (hoursUntilStart >= 2) {
      refundPercentage = 50;
    }

    booking.booking_status = "cancelled";
    booking.cancellation_reason = reason;
    booking.cancelled_at = now;
    booking.cancelled_by = req.user._id;
    booking.refund_amount = (booking.total_amount * refundPercentage) / 100;

    await booking.save();

    // Decrement facility booking counts
    await Facility.findByIdAndUpdate(
      booking.facility_id,
      {
        $inc: {
          total_bookings: -1,
          "sport_bookings.$[elem].booking_count": -1,
        },
      },
      {
        arrayFilters: [{ "elem.sport": booking.sport }],
      }
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking_id: booking.booking_id,
        refund_amount: booking.refund_amount,
        refund_percentage: refundPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message,
    });
  }
});

router.post("/:id/payment", async (req, res) => {
  try {
    const { payment_id, payment_method } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    booking.payment_status = "paid";
    booking.payment_id = payment_id;
    booking.payment_method = payment_method;

    await booking.save();

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      data: {
        booking_id: booking.booking_id,
        payment_status: booking.payment_status,
        total_amount: booking.total_amount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  }
});

router.get("/facility/:facilityId/availability", async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;
    const facilityId = req.params.facilityId;

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    const queryDate = new Date(date);
    const dayName = queryDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const daySlots = facility.weekly_slots[dayName];
    if (!daySlots) {
      return res.json({
        success: true,
        data: { available_slots: [] },
      });
    }

    const existingBookings = await Booking.find({
      facility_id: facilityId,
      booking_date: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      },
      booking_status: { $in: ["confirmed", "active"] },
    });

    const availableSlots = [];

    if (daySlots.mode === "explicit") {
      daySlots.slots.forEach((slot) => {
        const slotStart = new Date(`${date}T${slot.start}:00`);
        const slotEnd = new Date(
          slotStart.getTime() + slot.duration_min * 60000
        );

        const isConflict = existingBookings.some(
          (booking) =>
            booking.start_time < slotEnd && booking.end_time > slotStart
        );

        if (!isConflict) {
          availableSlots.push({
            start_time: slotStart,
            end_time: slotEnd,
            duration: slot.duration_min,
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        facility_id: facilityId,
        date: date,
        available_slots: availableSlots,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking availability",
      error: error.message,
    });
  }
});

setInterval(async () => {
  try {
    const now = new Date();

    await Booking.updateMany(
      {
        start_time: { $lte: now },
        booking_status: "confirmed",
        payment_status: "paid",
        auto_check_in: true,
        check_in_time: { $exists: false },
      },
      {
        $set: {
          check_in_time: now,
          booking_status: "active",
        },
      }
    );

    await Booking.updateMany(
      {
        end_time: { $lte: now },
        booking_status: "active",
        auto_check_out: true,
        check_out_time: { $exists: false },
      },
      {
        $set: {
          check_out_time: now,
          booking_status: "completed",
        },
      }
    );
  } catch (error) {}
}, 60000);

module.exports = router;
