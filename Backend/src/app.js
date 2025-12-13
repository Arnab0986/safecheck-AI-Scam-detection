const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Routes
const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const paymentRoutes = require('./routes/payment.routes');
const ocrRoutes = require('./routes/ocr.routes');

// Middleware
const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Required by Render / Vercel
app.set('trust proxy', 1);

/* ============================================================
   🔥 1. RAW BODY HANDLER (Cashfree Webhook ONLY)
   MUST be BEFORE express.json()
   ============================================================ */
app.post(
  '/api/v1/payment/webhook',
  express.raw({ type: '*/*' }),
  (req, res, next) => {
    req.rawBody = req.body.toString();
    next();
  }
);

/* ============================================================
   🧩 2. BODY PARSERS (AFTER webhook)
   ============================================================ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ============================================================
   🛡 SECURITY HEADERS
   ============================================================ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

/* ============================================================
   🌍 CORS — FIXED (NO CRASH, NORMALIZED ORIGINS)
   ============================================================ */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // remove spaces + trailing /

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, webhooks
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn('❌ CORS BLOCKED:', origin);
      return callback(null, false); // DO NOT throw error
    },
    credentials: true,
  })
);

/* ============================================================
   🚦 RATE LIMITING
   ============================================================ */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

/* ============================================================
   📡 ROUTES
   ============================================================ */
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/ocr', ocrRoutes);

/* ============================================================
   ❤️ HEALTH CHECK
   ============================================================ */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   📘 API DOCS
   ============================================================ */
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../../docs/api.md'));
});

/* ============================================================
   ❌ 404 HANDLER
   ============================================================ */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

/* ============================================================
   🧯 GLOBAL ERROR HANDLER
   ============================================================ */
app.use(errorMiddleware);

/* ============================================================
   🔌 MONGODB + SERVER START
   ============================================================ */
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => logger.info('✅ MongoDB connected'))
    .catch((err) => {
      logger.error(`❌ MongoDB error: ${err.message}`);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

mongoose.connection.once('open', () => {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

module.exports = app;
