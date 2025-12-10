const express = require('express');
const router = express.Router();

// FIXED: correct case-sensitive folder name
const paymentController = require('../Controllers/payment.controller');

const { paymentLimiter } = require('../middleware/rateLimit.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Webhook doesn't require auth (handled by signature verification)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authMiddleware);
router.use(paymentLimiter);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
