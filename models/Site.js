const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    site_id: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Site ID must be at least 2 characters long"],
      maxlength: [50, "Site ID cannot exceed 50 characters"],
    },
    site_name: {
      type: String,
      required: [true, "Site name is required"],
      trim: true,
    },
    site_address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    facilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
    investors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    site_managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Site", siteSchema);
