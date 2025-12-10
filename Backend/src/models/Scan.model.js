const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'url', 'job', 'invoice'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  result: {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    level: {
      type: String,
      enum: ['safe', 'suspicious', 'dangerous'],
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    detectedIssues: [{
      type: String
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    fileUrl: String,
    originalText: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ 'result.level': 1 });
scanSchema.index({ type: 1 });

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;