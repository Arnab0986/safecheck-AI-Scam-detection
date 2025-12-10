const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware");

// Webhook MUST use raw body → NO auth
router.post("/webhook", paymentController.handleProductionWebhook);

// Protected user requests
router.post("/create-order", auth, paymentController.createProductionOrder);
router.post("/verify", auth, paymentController.verifyPayment);

module.exports = router;
