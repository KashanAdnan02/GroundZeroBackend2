const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    default: "Guest"
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't include password in queries by default
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'investor', "facility_manager"],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  site_associated : {
    type :  mongoose.Schema.Types.ObjectId,
    ref : "Site",
  },
  verificationExpires: {
    type: Date
  },
  verificationType: {
    type: String,
    enum: ['email', 'phone']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  deactivatedAt: {
    type: Date
  },
  deactivationReason: {
    type: String
  },
  my_bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  lastLoggedIn: {
    type: Date,
  },
  lastPasswordChanged: {
    type: Date,
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ name: 1 });


userSchema.virtual('fullInfo').get(function() {
  return `${this.name} (${this.email})`;
});
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);