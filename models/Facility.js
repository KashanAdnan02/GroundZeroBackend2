const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    facility_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    sports: [
      {
        sport: String,
        base_price: Number,
      },
    ],
    weekly_slots: {
      monday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      tuesday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      wednesday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      thursday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      friday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      saturday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      sunday: {
        slots: [
          {
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
    },
    booking_rules: {
      min_duration_min: Number,                     
      max_duration_min: Number,
      allowed_durations: [Number],
    },
    total_bookings: {
      type: Number,
      default: 0,
    },
    sport_bookings: [
      {
        sport: String,
        booking_count: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Facility", facilitySchema);
