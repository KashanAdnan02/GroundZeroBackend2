const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    avatar :{
      type: String,
      default: "https://ui-avatars.com/api/?name=Guest&background=random",
    },
    name: {
      type: String,
      default: "Guest",
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "investor", "site_manager"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    site_associated: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Site",
    },
    verificationExpires: {
      type: Date,
    },
    investmentPercentage: [
      {
        site_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Site",
        },
        investmentPercentage : Number
      },
    ],
    verificationType: {
      type: String,
      enum: ["email", "phone"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
    },
    deactivationReason: {
      type: String,
    },
    my_bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    lastLoggedIn: {
      type: Date,
    },
    lastPasswordChanged: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ name: 1 });

userSchema.virtual("fullInfo").get(function () {
  return `${this.name} (${this.email})`;
});
userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
