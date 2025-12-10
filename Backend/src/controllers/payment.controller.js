// Add these production-specific functions

exports.createProductionOrder = async (req, res) => {
  try {
    const { plan, amount, customerPhone } = req.body;
    const user = req.user;

    // Validate plan and amount
    const validPlans = {
      basic: 49900,
      premium: 149900,
      enterprise: 499900
    };

    if (!validPlans[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    if (amount !== validPlans[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Amount does not match selected plan'
      });
    }

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${user._id.toString().slice(-6)}`;
    
    // Prepare order data
    const orderData = {
      orderId: orderId,
      orderAmount: amount.toString(), // Amount in paise as string
      customerDetails: {
        customerId: user._id.toString(),
        customerEmail: user.email,
        customerPhone: customerPhone || '9999999999',
        customerName: user.name
      },
      orderMeta: {
        plan: plan,
        returnUrl: `${process.env.CASHFREE_RETURN_URL}?order_id=${orderId}`,
        notifyUrl: process.env.CASHFREE_WEBHOOK_NOTIFY_URL
      }
    };

    // Create order in Cashfree
    const result = await cashfreeService.createOrder(orderData);

    if (!result.success) {
      throw new Error('Failed to create order with payment gateway');
    }

    // Save order reference in database
    const subscription = await Subscription.findOneAndUpdate(
      { userId: user._id },
      {
        plan: plan,
        status: 'pending',
        cashfreeOrderId: orderId,
        cashfreePaymentSessionId: result.data.payment_session_id,
        paymentDetails: {
          amount: amount / 100, // Convert paise to rupees for display
          currency: 'INR'
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

    logger.info(`Production order created for user ${user.email}: ${orderId}`);

    res.status(200).json({
      success: true,
      data: {
        order: result.data,
        subscription: subscription,
        paymentUrl: result.data.payment_url
      }
    });

  } catch (error) {
    logger.error(`Create production order error: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Payment initialization failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced webhook handler for production
exports.handleProductionWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-cashfree-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!cashfreeService.verifyWebhookSignature(payload, signature)) {
      logger.error('Invalid webhook signature received');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info(`Webhook received: ${event.event_type}`, { 
      orderId: event.data?.order?.order_id,
      timestamp: new Date().toISOString()
    });

    // Handle different event types
    switch (event.event_type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(event.data);
        break;
        
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(event.data);
        break;
        
      case 'REFUND_SUCCESS_WEBHOOK':
        await handleRefundSuccess(event.data);
        break;
        
      case 'SUBSCRIPTION_ACTIVATED':
        await handleSubscriptionActivated(event.data);
        break;
        
      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(event.data);
        break;
        
      default:
        logger.info(`Unhandled webhook event: ${event.event_type}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`, {
      event: req.body?.event_type
    });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};

// Handle payment success
async function handlePaymentSuccess(eventData) {
  const { order } = eventData;
  
  try {
    // Find subscription by order ID
    const subscription = await Subscription.findOne({ 
      cashfreeOrderId: order.order_id 
    });
    
    if (!subscription) {
      logger.error(`Subscription not found for order: ${order.order_id}`);
      return;
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    subscription.paymentDetails.transactionId = order.cf_order_id;
    subscription.paymentDetails.paymentMethod = order.payment_method;
    subscription.paymentDetails.paymentTime = new Date();
    
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(subscription.userId, {
      subscription: subscription.plan,
      subscriptionExpiry: subscription.endDate,
      scansLeft: subscription.features.maxScans,
      cashfreeCustomerId: order.customer_details?.customer_id
    });

    // Send confirmation email (implement email service)
    await sendPaymentConfirmationEmail(subscription.userId, order);

    logger.info(`Payment successful for order: ${order.order_id}`);

  } catch (error) {
    logger.error(`Error processing payment success: ${error.message}`, {
      orderId: order.order_id
    });
  }
}

// Handle payment failure
async function handlePaymentFailed(eventData) {
  const { order } = eventData;
  
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { cashfreeOrderId: order.order_id },
      { 
        status: 'failed',
        paymentDetails: {
          ...subscription.paymentDetails,
          failureReason: order.payment_failure_reason,
          failureTime: new Date()
        }
      },
      { new: true }
    );

    if (subscription) {
      // Notify user about payment failure
      await sendPaymentFailureEmail(subscription.userId, order);
      
      logger.info(`Payment failed for order: ${order.order_id}`, {
        reason: order.payment_failure_reason
      });
    }

  } catch (error) {
    logger.error(`Error processing payment failure: ${error.message}`);
  }
}