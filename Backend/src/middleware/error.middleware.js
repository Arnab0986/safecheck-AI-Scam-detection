const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.userId : 'anonymous'
  });

  // Default error response
  const errorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation error';
    errorResponse.details = err.details || err.errors;
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    errorResponse.error = 'Authentication required';
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'ForbiddenError') {
    errorResponse.error = 'Access denied';
    return res.status(403).json(errorResponse);
  }

  if (err.name === 'NotFoundError') {
    errorResponse.error = 'Resource not found';
    return res.status(404).json(errorResponse);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    errorResponse.error = 'File size too large. Maximum size is 5MB';
    return res.status(400).json(errorResponse);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    errorResponse.error = 'Unexpected file field';
    return res.status(400).json(errorResponse);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    errorResponse.error = `File upload error: ${err.message}`;
    return res.status(400).json(errorResponse);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    errorResponse.error = 'Duplicate key error';
    errorResponse.field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(errorResponse);
  }

  // MongoDB validation error
  if (err.name === 'CastError') {
    errorResponse.error = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json(errorResponse);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.error = 'Invalid token';
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.error = 'Token expired';
    return res.status(401).json(errorResponse);
  }

  // Default to 500 internal server error
  res.status(err.status || 500).json(errorResponse);
};

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.status = 400;
  }
}

/**
 * Unauthorized error class
 */
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

/**
 * Forbidden error class
 */
class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

/**
 * Not found error class
 */
class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};