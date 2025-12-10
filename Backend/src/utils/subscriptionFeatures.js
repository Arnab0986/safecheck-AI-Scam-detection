// utils/subscriptionFeatures.js

const plans = {
  basic: {
    name: "Basic",
    maxScans: 100,
    price: 49900,
    durationDays: 30,
    features: [
      "Text Scan",
      "URL Scan",
      "Job Offer Scan"
    ]
  },

  premium: {
    name: "Premium",
    maxScans: 500,
    price: 149900,
    durationDays: 30,
    features: [
      "All Basic features",
      "Invoice OCR",
      "Image Scam Detection",
      "Priority Support"
    ]
  },

  enterprise: {
    name: "Enterprise",
    maxScans: 5000,
    price: 499900,
    durationDays: 30,
    features: [
      "All Premium features",
      "Custom API Access",
      "Team Dashboard",
      "24/7 Support"
    ]
  }
};

// EXPORTABLE FUNCTION USED BY payment.controller.js
function getPlanFeatures(planKey) {
  return plans[planKey] || null;
}

module.exports = { getPlanFeatures };
