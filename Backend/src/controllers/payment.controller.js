// =========================
// IMPORTS
// =========================
const cashfreeService = require("../services/cashfree.service");
const Subscription = require("../models/Subscription.model");
const User = require("../models/User.model");
const logger = require("../utils/logger");

// Helper functions (ensure you have this file OR adjust path)
const { getPlanFeatures } = require("../utils/subscriptionFeatures");

// Email stubs (implement later)
async function sendPaymentConfirmationEmail() { return true; }
async function sendPaymentFailureEmail() { return true; }

// =========================
// CREATE ORDER (PRODUCTION)
// =========================
exports.createProductionOrder = async (req, res) => {
  try {
    const { plan, amount, customerPhone } = req.body;
    const user = req.user;

    // Valid plans
    const validPlans = {
      basic: 49900,
      premium: 149900,
      enterprise: 499900
    };

    if (!validPlans[plan]) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan selected"
      });
    }

    if (amount !== validPlans[plan]) {
      return res.status(400).json({
        success: false,
        error: "Amount does not match selected plan"
      });
    }

    // Generate order ID
    const orderId = `ORDER_${Date.now()}_${user._id.toString().slice(-6)}`;

    const orderData = {
      orderId,
      orderAmount: amount.toString(),
      customerDetails: {
        customerId: user._id.toString(),
        customerEmail: user.email,
        customerPhone: customerPhone || "9999999999",
        customerName: user.name
      },
      orderMeta: {
        plan,
        returnUrl: `${process.env.CASHFREE_RETURN_URL}?order_id=${orderId}`,
        notifyUrl: process.env.CASHFREE_WEBHOOK_NOTIFY_URL
      }
    };

    // Create order in Cashfree
    const result = await cashfreeService.createOrder(orderData);

    if (!result.success) {
      throw new Error("Failed to create order with payment gateway");
    }

    // Save subscription
    const subscription = await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        plan,
        status: "pending",
        cashfreeOrderId: orderId,
        cashfreePaymentSessionId: result.data.payment_session_id,
        paymentDetails: {
          amount: amount / 100,
          currency: "INR"
        },
        features: getPlanFeatures(plan)
      },
      { upsert: true, new: true }
    );

    // Update user
    await User.findByIdAndUpdate(user._id, {
      subscription: plan,
      cashfreeOrderId: orderId
    });

    logger.info(`Production order created for ${user.email}: ${orderId}`);

    res.status(200).json({
      success: true,
      data: {
        order: result.data,
        subscription,
        paymentUrl: result.data.payment_url
      }
    });
  } catch (error) {
    logger.error(`Create production order error: ${error.message}`);

    res.status(500).json({
      success: false,
      error: "Payment initialization failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// =========================
// WEBHOOK HANDLER
// =========================
exports.handleProductionWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-cashfree-signature"];
    const payload = JSON.stringify(req.body);

    if (!cashfreeService.verifyWebhookSignature(payload, signature)) {
      logger.error("Invalid webhook signature received");
      return res
        .status(401)
        .json({ success: false, error: "Invalid signature" });
    }

    const event = req.body;

    logger.info(`Webhook received: ${event.event_type}`, {
      orderId: event.data?.order?.order_id
    });

    // Event switch
    switch (event.event_type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        await handlePaymentSuccess(event.data);
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        await handlePaymentFailed(event.data);
        break;

      case "REFUND_SUCCESS_WEBHOOK":
        await handleRefundSuccess(event.data);
        break;

      case "SUBSCRIPTION_ACTIVATED":
        await handleSubscriptionActivated(event.data);
        break;

      case "SUBSCRIPTION_CANCELLED":
        await handleSubscriptionCancelled(event.data);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.event_type}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
};

// =========================
// PAYMENT SUCCESS
// =========================
async function handlePaymentSuccess(eventData) {
  const { order } = eventData;

  try {
    const subscription = await Subscription.findOne({
      cashfreeOrderId: order.order_id
    });

    if (!subscription) {
      logger.error(`Subscription not found for order: ${order.order_id}`);
      return;
    }

    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.endDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
    subscription.paymentDetails.transactionId = order.cf_order_id;
    subscription.paymentDetails.paymentMethod = order.payment_method;
    subscription.paymentDetails.paymentTime = new Date();

    await subscription.save();

    await User.findByIdAndUpdate(subscription.userId, {
      subscription: subscription.plan,
      subscriptionExpiry: subscription.endDate,
      scansLeft: subscription.features.maxScans,
      cashfreeCustomerId: order.customer_details?.customer_id
    });

    await sendPaymentConfirmationEmail(subscription.userId, order);

    logger.info(`Payment successful for order: ${order.order_id}`);
  } catch (error) {
    logger.error(`Error processing payment success: ${error.message}`);
  }
}

// =========================
// PAYMENT FAILURE
// =========================
async function handlePaymentFailed(eventData) {
  const { order } = eventData;

  try {
    const subscription = await Subscription.findOne({
      cashfreeOrderId: order.order_id
    });

    if (!subscription) return;

    subscription.status = "failed";
    subscription.paymentDetails.failureReason =
      order.payment_failure_reason || "Unknown";
    subscription.paymentDetails.failureTime = new Date();

    await subscription.save();

    await sendPaymentFailureEmail(subscription.userId, order);

    logger.info(`Payment failed for order: ${order.order_id}`);
  } catch (error) {
    logger.error(`Error processing payment failure: ${error.message}`);
  }
}

// =========================
// OPTIONAL HANDLERS (stubs)
// =========================
async function handleRefundSuccess() {}
async function handleSubscriptionActivated() {}
async function handleSubscriptionCancelled() {}

// =========================
// VERIFY PAYMENT (For routes)
// =========================
exports.verifyPayment = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Verification endpoint working"
  });
};
