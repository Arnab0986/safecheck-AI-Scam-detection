const rateLimit = require('express-rate-limit');

/**
 * General rate limiter for all routes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Bypass rate limiting for subscribed users
    if (req.rateLimitBypass) {
      return 1000; // High limit for subscribed users
    }
    return 100; // Standard limit
  },
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? req.user.userId : req.ip;
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * OCR endpoint rate limiter
 */
const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.user?.subscription?.active) {
      return 50; // Higher limit for subscribed users
    }
    return 10; // Standard limit
  },
  message: {
    success: false,
    error: 'Too many OCR requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Payment endpoint rate limiter
 */
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many payment requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Scan endpoint rate limiter
 */
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (req.user?.subscription?.active) {
      return 100; // Higher limit for subscribed users
    }
    return 20; // Standard limit
  },
  message: {
    success: false,
    error: 'Too many scan requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  ocrLimiter,
  paymentLimiter,
  scanLimiter
};