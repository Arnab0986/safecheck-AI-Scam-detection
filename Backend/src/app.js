require('express-async-errors');
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const paymentRoutes = require('./routes/payment.routes');
const ocrRoutes = require('./routes/ocr.routes');

const app = express();
app.set('trust proxy', 1);

// ------------------------------------
// Body Parser
// ------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ------------------------------------
// Helmet (security) - CSP disabled for Render
// ------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ------------------------------------
// Dynamic CORS Handling
// ------------------------------------
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Allow mobile apps, Postman, render health checks

      if (allowedOrigins.includes(origin)) return cb(null, true);

      console.log("❌ CORS blocked:", origin);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ------------------------------------
// Rate Limiting
// ------------------------------------
app.use(
  '/api/',
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    },
  })
);

// ------------------------------------
// Logger (Morgan + Winston)
// ------------------------------------
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ------------------------------------
// Swagger API Documentation
// ------------------------------------
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SafeCheck API',
      version: '1.0.0',
      description: 'API documentation for SafeCheck scam detection platform',
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ------------------------------------
// Health Check Endpoint
// ------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date(),
    db: mongoose.connection.readyState,
  });
});

// ------------------------------------
// Main API Routes
// ------------------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/ocr', ocrRoutes);

// ------------------------------------
// Not Found Handler
// ------------------------------------
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ------------------------------------
// Global Error Handler
// ------------------------------------
app.use(errorMiddleware);

// ------------------------------------
// MongoDB Connection
// ------------------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => {
    logger.error('MongoDB error:', err);
    process.exit(1);
  });

// ------------------------------------
// Start Server
// ------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

module.exports = app;
