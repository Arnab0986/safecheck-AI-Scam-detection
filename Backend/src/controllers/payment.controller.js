const crypto = require('crypto');
const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const cashfreeService = require('../services/cashfree.service');
const logger = require('../utils/logger');

exports.createOrder = async (req, res) => {
  try {
    const { plan, amount } = req.body;
    const user = req.user;

    // Validate plan
    const validPlans = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }

    // Create order in Cashfree
    const orderData = {
      orderId: `ORDER_${Date.now()}_${user._id}`,
      orderAmount: amount,
      orderCurrency: 'INR',
      orderNote: `SafeCheck ${plan} subscription`,
      customerDetails: {
        customerId: user._id.toString(),
        customerEmail: user.email,
        customerPhone: '9999999999'
      },
      orderMeta: {
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success?order_id={order_id}`
      }
    };

    const order = await cashfreeService.createOrder(orderData);

    // Update user subscription status
    const subscription = await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        plan,
        status: 'pending',
        cashfreeOrderId: orderData.orderId,
        paymentDetails: {
          amount,
          currency: 'INR'
        },
        features: getPlanFeatures(plan)
      },
      { upsert: true, new: true }
    );

    logger.info(`Order created for user ${user.email}: ${orderData.orderId}`);

    res.status(200).json({
      success: true,
      data: {
        order,
        subscription
      }
    });

  } catch (error) {
    logger.error(`Create order error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = req.user;

    // Verify payment with Cashfree
    const paymentStatus = await cashfreeService.verifyPayment(orderId);

    if (paymentStatus === 'PAID') {
      // Update subscription
      const subscription = await Subscription.findOneAndUpdate(
        { userId: user._id, cashfreeOrderId: orderId },
        {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          'paymentDetails.transactionId': orderId
        },
        { new: true }
      );

      // Update user
      await User.findByIdAndUpdate(user._id, {
        subscription: subscription.plan,
        subscriptionExpiry: subscription.endDate,
        scansLeft: subscription.features.maxScans
      });

      logger.info(`Payment verified for user ${user.email}: ${orderId}`);

      res.status(200).json({
        success: true,
        data: {
          status: 'success',
          subscription
        }
      });
    } else {
      res.status(400).json({
        success: false,
        data: {
          status: 'failed',
          message: 'Payment not successful'
        }
      });
    }

  } catch (error) {
    logger.error(`Verify payment error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-cashfree-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const secret = process.env.CASHFREE_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    if (signature !== expectedSignature) {
      logger.error('Invalid webhook signature');
      return res.status(401).json({ success: false });
    }

    const event = req.body;
    
    // Handle different webhook events
    switch (event.event_type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(event);
        break;
      case 'REFUND_SUCCESS_WEBHOOK':
        await handleRefundSuccess(event);
        break;
      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
    }

    res.status(200).json({ success: true });

  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(500).json({ success: false });
  }
};

async function handlePaymentSuccess(event) {
  const { orderId } = event.data.order;
  
  // Find subscription by orderId
  const subscription = await Subscription.findOne({ cashfreeOrderId: orderId });
  if (subscription) {
    subscription.status = 'active';
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    subscription.paymentDetails.transactionId = event.data.order.transactionId;
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(subscription.userId, {
      subscription: subscription.plan,
      subscriptionExpiry: subscription.endDate,
      scansLeft: subscription.features.maxScans
    });

    logger.info(`Webhook: Payment success for order ${orderId}`);
  }
}

async function handleRefundSuccess(event) {
  const { orderId } = event.data.order;
  
  const subscription = await Subscription.findOneAndUpdate(
    { cashfreeOrderId: orderId },
    { status: 'cancelled' },
    { new: true }
  );

  if (subscription) {
    await User.findByIdAndUpdate(subscription.userId, {
      subscription: 'free',
      subscriptionExpiry: null
    });

    logger.info(`Webhook: Refund processed for order ${orderId}`);
  }
}

async function handleSubscriptionCancelled(event) {
  const { subscriptionId } = event.data;
  
  const subscription = await Subscription.findOneAndUpdate(
    { cashfreeSubscriptionId: subscriptionId },
    { status: 'cancelled' },
    { new: true }
  );

  if (subscription) {
    await User.findByIdAndUpdate(subscription.userId, {
      subscription: 'free',
      subscriptionExpiry: null
    });

    logger.info(`Webhook: Subscription cancelled ${subscriptionId}`);
  }
}

function getPlanFeatures(plan) {
  const features = {
    basic: {
      maxScans: 100,
      ocrEnabled: true,
      apiAccess: false,
      prioritySupport: false
    },
    premium: {
      maxScans: 1000,
      ocrEnabled: true,
      apiAccess: true,
      prioritySupport: true
    },
    enterprise: {
      maxScans: 10000,
      ocrEnabled: true,
      apiAccess: true,
      prioritySupport: true
    }
  };
  return features[plan] || features.basic;
}