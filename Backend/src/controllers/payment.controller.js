// controllers/payment.controller.js
const cashfreeService = require("../services/CashfreeService");
const Subscription = require("../models/Subscription.model");
const User = require("../models/User.model");
const logger = require("../utils/logger");
const { getPlanFeatures } = require("../utils/subscriptionFeatures");

/**
 * ==========================================
 * CREATE ORDER
 * ==========================================
 */
exports.createProductionOrder = async (req, res) => {
  try {
    const { plan, amount, customerPhone } = req.body;
    const user = req.user;

    const PRICES = {
      basic: 49900,
      premium: 149900,
      enterprise: 499900,
    };

    if (!PRICES[plan]) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }

    if (amount !== PRICES[plan]) {
      return res.status(400).json({
        success: false,
        error: "Amount mismatch — do not modify payment values",
      });
    }

    const orderId = `ORDER_${Date.now()}_${user._id.toString().slice(-6)}`;

    const orderData = {
      orderId,
      orderAmount: amount.toString(),
      customerDetails: {
        customerId: user._id.toString(),
        customerEmail: user.email,
        customerPhone: customerPhone || "9999999999",
        customerName: user.name,
      },
      orderMeta: {
        plan,
      },
    };

    const result = await cashfreeService.createOrder(orderData);
    if (!result.success) throw new Error("Cashfree failed");

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        plan,
        status: "pending",
        cashfreeOrderId: orderId,
        cashfreePaymentSessionId: result.data.payment_session_id,
        paymentDetails: { amount: amount / 100, currency: "INR" },
        features: getPlanFeatures(plan),
      },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(user._id, {
      subscription: "pending",
      cashfreeOrderId: orderId,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        paymentUrl: result.data.payment_url,
        session: result.data,
      },
    });
  } catch (err) {
    logger.error("Create order error: " + err.message);
    return res.status(500).json({
      success: false,
      error: "Could not initialize payment",
    });
  }
};

/**
 * ==========================================
 * WEBHOOK HANDLER
 * ==========================================
 */
exports.handleProductionWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-cashfree-signature"];
    const payload = req.rawBody;

    if (!cashfreeService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    const event = req.body;

    switch (event.event_type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        await handlePaymentSuccess(event.data.order);
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        await handlePaymentFailed(event.data.order);
        break;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Webhook error: " + err.message);
    return res.status(500).json({ success: false });
  }
};

/**
 * ==========================================
 * PAYMENT SUCCESS
 * ==========================================
 */
async function handlePaymentSuccess(order) {
  const subscription = await Subscription.findOne({
    cashfreeOrderId: order.order_id,
  });

  if (!subscription) return;

  const paymentInfo = order.payments?.[0] || {};

  subscription.status = "active";
  subscription.startDate = new Date();
  subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  subscription.paymentDetails = {
    ...subscription.paymentDetails,
    transactionId: order.cf_order_id,
    paymentMethod: paymentInfo.payment_method,
    paymentTime: paymentInfo.payment_time,
  };

  await subscription.save();

  await User.findByIdAndUpdate(subscription.userId, {
    subscription: subscription.plan,
    subscriptionExpiry: subscription.endDate,
    scansLeft: subscription.features.maxScans,
    cashfreeCustomerId: order.customer_details?.customer_id,
  });
}

/**
 * ==========================================
 * PAYMENT FAILED
 * ==========================================
 */
async function handlePaymentFailed(order) {
  const subscription = await Subscription.findOne({
    cashfreeOrderId: order.order_id,
  });

  if (!subscription) return;

  subscription.status = "failed";
  subscription.paymentDetails.failureReason =
    order.payment_failure_reason || "Unknown failure";

  await subscription.save();
}

/**
 * ==========================================
 * VERIFY PAYMENT (Frontend)
 * ==========================================
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const result = await cashfreeService.verifyPayment(orderId);

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
