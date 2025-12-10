const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const scanRoutes = require('./routes/scan.routes');
const paymentRoutes = require('./routes/payment.routes');
const ocrRoutes = require('./routes/ocr.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Create upload directories
const uploadDir = process.env.OCR_TMP_DIR || '/tmp/ocr';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/ocr', ocrRoutes);

// API documentation
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../../docs/api.md'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use(errorMiddleware);

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info('✅ MongoDB connected successfully');
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    console.error(`❌ MongoDB connection error: ${err.message}`);
    setTimeout(connectWithRetry, 5000);
  });
};

// Start server only after MongoDB connects
const PORT = process.env.PORT || 4000;

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
  });
};

// Connect to MongoDB and start server
connectWithRetry();

mongoose.connection.once('open', () => {
  startServer();
});

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;