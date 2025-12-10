// models/User.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    name: {
      type: String,
      default: '',
      trim: true,
    },

    phone: {
      type: String,
      default: '',
      trim: true,
    },

    // Subscription & usage
    subscription: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
    scansLeft: {
      type: Number,
      default: 10,
    },

    // Cashfree / payment
    cashfreeOrderId: { type: String, default: null },
    cashfreeCustomerId: { type: String, default: null },

    // Password reset
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Hash password before saving if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Compare plain password with hashed password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has scans left (premium & enterprise = unlimited)
UserSchema.methods.hasScansLeft = function () {
  if (this.subscription === 'premium' || this.subscription === 'enterprise') {
    return true;
  }
  return (this.scansLeft || 0) > 0;
};

// Deduct one scan (only for free / limited plans). Saves document.
UserSchema.methods.useScan = async function () {
  if (this.subscription === 'free') {
    this.scansLeft = Math.max(0, (this.scansLeft || 0) - 1);
    return this.save();
  }
  // for paid plans, don't decrement but still return saved doc for consistency
  return this;
};

module.exports = mongoose.model('User', UserSchema);
