const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}`);
  console.error(err.stack);

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;