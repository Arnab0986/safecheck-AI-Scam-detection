const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific limiters for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts');
const scanLimiter = createRateLimiter(15 * 60 * 1000, 50, 'Too many scan requests');
const paymentLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Too many payment requests');

module.exports = {
  authLimiter,
  scanLimiter,
  paymentLimiter
};