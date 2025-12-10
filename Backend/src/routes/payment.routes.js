const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller"); // FIXED CASE

const { paymentLimiter } = require("../middleware/rateLimit.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// Public webhook
router.post("/webhook", paymentController.handleProductionWebhook);

// Protected
router.use(authMiddleware);
router.use(paymentLimiter);

router.post("/create-order", paymentController.createProductionOrder);
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
