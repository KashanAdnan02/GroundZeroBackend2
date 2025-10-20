const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    booking_id: {
      type: String,
      required: true,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    facility_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    booking_date: {
      type: String,
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    duration_minutes: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    payment_method: {
      type: String,
    },
    payment_id: {
      type: String,
    },
    booking_status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    check_in_time: {
      type: Date,
    },
    check_out_time: {
      type: Date,
    },
    auto_check_in: {
      type: Boolean,
      default: false,
    },
    auto_check_out: {
      type: Boolean,
      default: false,
    },
    actual_duration: {
      type: Number,
    },
    notes: {
      type: String,
    },
    cancellation_reason: {
      type: String,
    },
    cancelled_at: {
      type: Date,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refund_amount: {
      type: Number,
      default: 0,
    },
    late_fee: {
      type: Number,
      default: 0,
    },
    equipment_used: [
      {
        name: String,
        quantity: Number,
        cost: Number,
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    reviewed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ start_time: 1, booking_status: 1, payment_status: 1 });
bookingSchema.index({ end_time: 1, booking_status: 1 });
bookingSchema.index({ facility_id: 1, start_time: 1, end_time: 1 });
bookingSchema.index({ user_id: 1, booking_date: 1 });
bookingSchema.index({ facility_id: 1, start_time: 1, end_time: 1 });
bookingSchema.index({ booking_status: 1 });
bookingSchema.index({ payment_status: 1 });

bookingSchema.pre("save", function (next) {
  if (!this.booking_id) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.booking_id = `BK${timestamp}${random}`.toUpperCase();
  }
  next();
});

bookingSchema.methods.canCheckIn = function () {
  const now = new Date();
  const gracePeriod = 15 * 60 * 1000;
  return (
    now >= this.start_time.getTime() - gracePeriod &&
    now <= this.end_time.getTime() &&
    this.booking_status === "confirmed" &&
    this.payment_status === "paid"
  );
};

bookingSchema.methods.canCheckOut = function () {
  return this.booking_status === "active" && this.check_in_time;
};

bookingSchema.methods.isOverdue = function () {
  const now = new Date();
  return now > this.end_time && this.booking_status === "active";
};

bookingSchema.methods.calculateActualDuration = function () {
  if (this.check_in_time && this.check_out_time) {
    return Math.round((this.check_out_time - this.check_in_time) / (1000 * 60));
  }
  return 0;
};

module.exports = mongoose.model("Booking", bookingSchema);
