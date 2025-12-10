// models/Subscription.model.js
const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one subscription per user
    },

    plan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },

    status: {
      type: String,
      enum: ["inactive", "pending", "active", "failed", "cancelled"],
      default: "inactive",
    },

    cashfreeOrderId: String,
    cashfreePaymentSessionId: String,
    cashfreeSubscriptionId: String,

    startDate: Date,
    endDate: Date,

    paymentDetails: {
      amount: Number,
      currency: { type: String, default: "INR" },
      paymentMethod: String,
      transactionId: String,
      failureReason: String,
      paymentTime: Date,
    },

    features: {
      maxScans: Number,
      ocrEnabled: Boolean,
      apiAccess: Boolean,
      prioritySupport: Boolean,
    },
  },
  { timestamps: true }
);

SubscriptionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
