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
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      tuesday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      wednesday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      thursday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      friday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      saturday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
            from: String,
            to: String,
            duration_min: Number,
          },
        ],
      },
      sunday: {
        mode: {
          type: String,
          enum: ["explicit", "pattern"],
        },
        slots: [
          {
            start: String,
            duration_min: Number,
          },
        ],
        blocks: [
          {
            date: String,
            day: String,
            month: String,
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
