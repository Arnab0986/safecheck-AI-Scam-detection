const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment processing and subscriptions
 */

/**
 * @swagger
 * /api/v1/payment/create-order:
 *   post:
 *     summary: Create payment order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 example: monthly
 *     responses:
 *       200:
 *         description: Order created successfully
 */
router.post('/create-order', authMiddleware, paymentController.createOrder);

/**
 * @swagger
 * /api/v1/payment/verify:
 *   post:
 *     summary: Verify payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *             properties:
 *               order_id:
 *                 type: string
 *                 example: ORDER_123456789
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.post('/verify', authMiddleware, paymentController.verifyPayment);

/**
 * @swagger
 * /api/v1/payment/webhook:
 *   post:
 *     summary: Payment webhook (Cashfree callback)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @swagger
 * /api/v1/payment/subscription:
 *   get:
 *     summary: Get user's subscription status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved
 */
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const Subscription = require('../models/Subscription.model');
    const subscription = await Subscription.findOne({
      user: req.user.userId,
      status: 'ACTIVE'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        subscription,
        isActive: subscription ? subscription.isActive : false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

module.exports = router;