const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  paymentId: {
    type: String
  },
  paymentSessionId: {
    type: String
  },
  paidAmount: {
    type: Number
  },
  paymentTime: {
    type: Date
  },
  subscriptionStart: {
    type: Date
  },
  subscriptionEnd: {
    type: Date,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'upi', 'wallet', 'emi']
  },
  gateway: {
    type: String,
    default: 'cashfree'
  },
  metadata: {
    ip: String,
    userAgent: String,
    attempts: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ subscriptionEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'ACTIVE') return false;
  if (!this.subscriptionEnd) return true;
  return new Date() < this.subscriptionEnd;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.isActive || !this.subscriptionEnd) return 0;
  const now = new Date();
  const end = new Date(this.subscriptionEnd);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to cancel subscription
subscriptionSchema.methods.cancel = async function() {
  this.status = 'CANCELLED';
  await this.save();
  
  // Update user's subscription status
  const User = require('./User.model');
  await User.findByIdAndUpdate(this.user, {
    'subscription.active': false,
    'subscription.plan': 'free'
  });
  
  return this;
};

// Method to renew subscription
subscriptionSchema.methods.renew = async function(plan, amount) {
  const now = new Date();
  const endDate = new Date(now);
  
  if (plan === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  
  this.plan = plan;
  this.amount = amount;
  this.status = 'ACTIVE';
  this.subscriptionStart = now;
  this.subscriptionEnd = endDate;
  
  await this.save();
  return this;
};

// Static method to find active subscriptions
subscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({
    user: userId,
    status: 'ACTIVE',
    subscriptionEnd: { $gt: new Date() }
  });
};

// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    status: 'ACTIVE',
    subscriptionEnd: {
      $lt: date,
      $gt: new Date()
    }
  }).populate('user', 'name email');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;