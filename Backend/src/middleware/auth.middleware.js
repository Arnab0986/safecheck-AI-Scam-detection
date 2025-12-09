const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      subscription: user.subscription
    };

    // Update last login
    await user.updateLastLogin();

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed.'
    });
  }
};

/**
 * Admin middleware
 * Requires user to have admin role
 */
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Subscription middleware
 * Requires active subscription
 */
const subscriptionMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user.subscription.active) {
      return res.status(403).json({
        success: false,
        error: 'Subscription required. Please upgrade your plan.'
      });
    }

    // Check if subscription has expired
    if (user.subscription.endsAt && new Date() > user.subscription.endsAt) {
      user.subscription.active = false;
      await user.save();
      
      return res.status(403).json({
        success: false,
        error: 'Subscription expired. Please renew your plan.'
      });
    }

    next();
  } catch (error) {
    logger.error('Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Subscription verification failed.'
    });
  }
};

/**
 * Rate limit bypass for subscribed users
 */
const rateLimitBypass = async (req, res, next) => {
  if (req.user) {
    const user = await User.findById(req.user.userId);
    if (user.subscription.active) {
      // Bypass rate limiting for subscribed users
      req.rateLimitBypass = true;
    }
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  subscriptionMiddleware,
  rateLimitBypass
};