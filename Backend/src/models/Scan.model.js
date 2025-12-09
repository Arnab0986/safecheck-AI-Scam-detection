const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'url', 'job_offer', 'invoice', 'ocr'],
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  result: {
    isScam: {
      type: Boolean,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    category: {
      type: String,
      enum: [
        'phishing',
        'fraud',
        'spam',
        'malware',
        'job_scam',
        'invoice_fraud',
        'suspicious',
        'safe',
        'unknown'
      ]
    },
    explanation: {
      type: String,
      required: true
    },
    indicators: [{
      type: String
    }],
    recommendations: [{
      type: String
    }]
  },
  metadata: {
    source: String,
    language: String,
    length: Number,
    processingTime: Number
  },
  imagePath: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Virtual for formatted risk level
scanSchema.virtual('riskLevel').get(function() {
  if (this.riskScore >= 80) return 'critical';
  if (this.riskScore >= 60) return 'high';
  if (this.riskScore >= 40) return 'medium';
  if (this.riskScore >= 20) return 'low';
  return 'safe';
});

// Virtual for color based on risk
scanSchema.virtual('riskColor').get(function() {
  if (this.riskScore >= 80) return '#ef4444'; // red
  if (this.riskScore >= 60) return '#f97316'; // orange
  if (this.riskScore >= 40) return '#eab308'; // yellow
  if (this.riskScore >= 20) return '#84cc16'; // lime
  return '#22c55e'; // green
});

// Indexes for query optimization
scanSchema.index({ user: 1, createdAt: -1 });
scanSchema.index({ type: 1, riskScore: -1 });
scanSchema.index({ createdAt: -1 });
scanSchema.index({ 'result.isScam': 1 });

// Middleware to calculate metadata
scanSchema.pre('save', function(next) {
  if (this.content) {
    this.metadata = this.metadata || {};
    this.metadata.length = this.content.length;
    this.metadata.language = this.detectLanguage(this.content);
  }
  next();
});

// Method to detect language (simplified)
scanSchema.methods.detectLanguage = function(text) {
  // Simple detection based on common words
  const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have'];
  const hindiWords = ['और', 'है', 'की', 'से', 'को', 'में', 'यह', 'नहीं', 'तो'];
  
  const textLower = text.toLowerCase();
  const engCount = englishWords.filter(word => textLower.includes(word)).length;
  const hinCount = hindiWords.filter(word => text.includes(word)).length;
  
  if (hinCount > engCount) return 'hi';
  return 'en';
};

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;