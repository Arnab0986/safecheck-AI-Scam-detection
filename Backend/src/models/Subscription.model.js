const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  cashfreeSubscriptionId: {
    type: String
  },
  cashfreeOrderId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'pending'],
    default: 'inactive'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  paymentDetails: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: String,
    transactionId: String
  },
  features: {
    maxScans: Number,
    ocrEnabled: Boolean,
    apiAccess: Boolean,
    prioritySupport: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;