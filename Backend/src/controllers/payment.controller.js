const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const cashfreeService = require('../services/cashfree.service');
const logger = require('../utils/logger');
const validator = require('../utils/validators');

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
 *     responses:
 *       200:
 *         description: Order created successfully
 */
const createOrder = async (req, res) => {
  const { error } = validator.validatePaymentOrder(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { plan } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Define plan details
    const planDetails = {
      monthly: {
        amount: 999, // ₹9.99
        currency: 'INR',
        description: 'Monthly SafeCheck Pro Subscription'
      },
      yearly: {
        amount: 9999, // ₹99.99
        currency: 'INR',
        description: 'Yearly SafeCheck Pro Subscription'
      }
    };

    const details = planDetails[plan];
    if (!details) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Create order in Cashfree
    const orderData = {
      order_amount: details.amount,
      order_currency: details.currency,
      order_id: `ORDER_${Date.now()}_${userId}`,
      customer_details: {
        customer_id: userId,
        customer_email: user.email,
        customer_name: user.name,
        customer_phone: '9999999999' // Default for testing
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?order_id={order_id}`
      }
    };

    const orderResult = await cashfreeService.createOrder(orderData);

    // Save subscription record
    await Subscription.create({
      user: userId,
      orderId: orderResult.order_id,
      plan,
      amount: details.amount,
      currency: details.currency,
      status: 'PENDING',
      paymentSessionId: orderResult.payment_session_id
    });

    logger.info(`Order created for user ${userId}, order: ${orderResult.order_id}`);

    res.json({
      success: true,
      data: {
        order: orderResult,
        payment_session_id: orderResult.payment_session_id
      }
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
};

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
 *     responses:
 *       200:
 *         description: Payment verified
 */
const verifyPayment = async (req, res) => {
  const { error } = validator.validatePaymentVerification(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { order_id } = req.body;
  const userId = req.user.userId;

  try {
    // Verify payment with Cashfree
    const paymentStatus = await cashfreeService.getPaymentStatus(order_id);

    if (paymentStatus.order_status === 'PAID') {
      // Update subscription
      const subscription = await Subscription.findOneAndUpdate(
        { orderId: order_id, user: userId },
        {
          status: 'ACTIVE',
          paymentId: paymentStatus.cf_payment_id,
          paidAmount: paymentStatus.payment_amount,
          paymentTime: new Date(paymentStatus.payment_time),
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + (req.body.plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        },
        { new: true }
      );

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        'subscription.active': true,
        'subscription.plan': subscription.plan,
        'subscription.endsAt': subscription.subscriptionEnd
      });

      logger.info(`Payment verified for order ${order_id}, user ${userId}`);

      res.json({
        success: true,
        data: {
          verified: true,
          subscription
        }
      });
    } else {
      res.json({
        success: false,
        error: 'Payment not completed'
      });
    }
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
};

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
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;

    // Verify webhook signature
    const isValid = await cashfreeService.verifyWebhookSignature(signature, payload);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { orderId, orderStatus } = payload.data;

    if (orderStatus === 'PAID') {
      const subscription = await Subscription.findOneAndUpdate(
        { orderId },
        {
          status: 'ACTIVE',
          paymentId: payload.data.cfPaymentId,
          paidAmount: payload.data.paymentAmount,
          paymentTime: new Date(payload.data.paymentTime),
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        { new: true }
      );

      if (subscription) {
        await User.findByIdAndUpdate(subscription.user, {
          'subscription.active': true,
          'subscription.plan': subscription.plan,
          'subscription.endsAt': subscription.subscriptionEnd
        });
      }

      logger.info(`Webhook: Subscription activated for order ${orderId}`);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook
};