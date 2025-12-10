const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const paymentRoutes = require('./routes/payment.routes');
const ocrRoutes = require('./routes/ocr.routes');

const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Required by Vercel/Render
app.set('trust proxy', 1);

/* ============================================================
   🔥 1. RAW BODY HANDLER — MUST COME BEFORE express.json()
   This is ONLY for Cashfree webhook signature verification.
   ============================================================ */
app.post(
  '/api/v1/payment/webhook',
  express.raw({ type: '*/*' }), // capture raw payload
  (req, res, next) => {
    req.rawBody = req.body.toString();
    next();
  }
);

/* ============================================================
   🧩 2. Normal Body Parsers (DON’T COME BEFORE WEBHOOK)
   ============================================================ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ============================================================
   🛡 Security, CORS, Rate Limiting
   ============================================================ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, try again later.',
});

app.use('/api/', limiter);

/* ============================================================
   📡 Routes
   ============================================================ */

// Webhook route MUST stay before JSON parser version of payment router
const paymentRouter = require('./routes/payment.routes');
app.use('/api/v1/payment', paymentRouter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/ocr', ocrRoutes);

/* ============================================================
   ❤️ Health + Docs
   ============================================================ */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../../docs/api.md'));
});

/* ============================================================
   ❌ 404 + Global Error Handler
   ============================================================ */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.use(errorMiddleware);

/* ============================================================
   🔌 Mongo + Server Boot
   ============================================================ */
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => {
      logger.error(`MongoDB error: ${err.message}`);
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
