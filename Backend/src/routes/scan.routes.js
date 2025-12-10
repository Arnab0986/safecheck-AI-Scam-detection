const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const { scanLimiter } = require('../middleware/rateLimit.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// All scan routes require authentication
router.use(authMiddleware);

// Apply rate limiting
router.use(scanLimiter);

// Scan routes
router.post('/text', scanController.scanText);
router.post('/url', scanController.scanUrl);
router.post('/job', scanController.scanJobOffer);

// History routes
router.get('/history', scanController.getScanHistory);
router.get('/:id', scanController.getScanById);

module.exports = router;