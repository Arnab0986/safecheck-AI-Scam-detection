// services/CashfreeService.js
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secret = process.env.CASHFREE_SECRET || process.env.CASHFREE_SECRET_KEY;
    this.mode = (process.env.CASHFREE_MODE || 'PROD').toUpperCase();

    // Choose endpoints based on mode
    if (this.mode === 'SANDBOX' || this.mode === 'TEST') {
      this.baseUrl = 'https://sandbox.cashfree.com/pg';
      this.checkoutUrl = 'https://sandbox.cashfree.com';
    } else {
      this.baseUrl = 'https://api.cashfree.com/pg';
      this.checkoutUrl = 'https://pay.cashfree.com';
    }

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'x-api-version': '2022-09-01',
      'x-client-id': this.appId,
      'x-client-secret': this.secret,
    };
  }

  // Internal request helper
  async _post(path, data, opts = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.defaultHeaders, ...(opts.headers || {}) };
    try {
      const res = await axios.post(url, data, { headers, timeout: opts.timeout || 15000 });
      return res.data;
    } catch (err) {
      logger.error(`Cashfree POST ${url} error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    }
  }

  async _get(path, opts = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.defaultHeaders, ...(opts.headers || {}) };
    try {
      const res = await axios.get(url, { headers, timeout: opts.timeout || 10000 });
      return res.data;
    } catch (err) {
      logger.error(`Cashfree GET ${url} error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    }
  }

  // Create an order and return payment_url + gateway response
  async createOrder(orderData) {
    try {
      const required = ['orderId', 'orderAmount', 'customerDetails'];
      required.forEach((f) => {
        if (!orderData[f]) throw new Error(`Missing required field: ${f}`);
      });

      const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const payload = {
        order_id: orderData.orderId,
        order_amount: orderData.orderAmount.toString(),
        order_currency: 'INR',
        order_note: orderData.orderNote || `SafeCheck Subscription - ${orderData.orderId}`,
        customer_details: {
          customer_id: orderData.customerDetails.customerId,
          customer_email: orderData.customerDetails.customerEmail,
          customer_phone: orderData.customerDetails.customerPhone || '9999999999',
          customer_name: orderData.customerDetails.customerName || 'Customer',
        },
        order_meta: {
          return_url: `${(process.env.CASHFREE_RETURN_URL || '').replace(/\/$/, '')}?order_id={order_id}`,
          notify_url: process.env.CASHFREE_WEBHOOK_NOTIFY_URL,
          payment_methods: 'cc,dc,upi,nb,wallet,paylater',
          ...(orderData.orderMeta || {}),
        },
        order_expiry_time: expiry,
        order_tags: { subscription: 'true', plan: orderData.plan || orderData.orderMeta?.plan || 'basic' },
      };

      logger.info('Creating Cashfree order', { mode: this.mode, orderId: payload.order_id });

      const data = await this._post('/orders', payload);

      // Cashfree responses may vary by mode/version
      const paymentSessionId = data.payment_session_id || data.order_id || data.data?.payment_session_id;
      const paymentUrl = paymentSessionId ? `${this.checkoutUrl}/pay/${paymentSessionId}` : null;

      if (!paymentSessionId) {
        logger.error('Unexpected create order response', { response: data });
        throw new Error('Failed to create payment session');
      }

      return {
        success: true,
        data: {
          raw: data,
          payment_session_id: paymentSessionId,
          payment_url: paymentUrl,
        },
      };
    } catch (err) {
      // map common errors
      if (err.response?.status === 401) throw new Error('Invalid Cashfree credentials');
      if (err.code === 'ECONNABORTED') throw new Error('Payment request timed out');
      // bubble up message
      throw new Error(err.response?.data?.message || err.message || 'Cashfree createOrder failed');
    }
  }

  // Verify payment status for an order
  async verifyPayment(orderId) {
    try {
      if (!orderId) throw new Error('orderId required');

      const data = await this._get(`/orders/${orderId}`);

      // Cashfree v1/v2 may return order object under 'order' or directly
      const order = data.order || data || {};

      // try find status
      const rawStatus = (order.order_status || order.status || order.orderStatus || '').toString().toUpperCase();

      // Normalize
      if (rawStatus.includes('PAID') || rawStatus === 'SUCCESS') {
        return { status: 'PAID', order, paymentDetails: order.payment_details || order.payments || null };
      }

      if (rawStatus.includes('ACTIVE') || rawStatus.includes('PENDING')) {
        return { status: 'PENDING', order };
      }

      // any other statuses we treat as failed
      return { status: 'FAILED', order, reason: rawStatus || 'UNKNOWN' };
    } catch (err) {
      logger.error('Cashfree verifyPayment error', { orderId, message: err.message });
      return { status: 'ERROR', error: err.response?.data || err.message || 'Failed to verify payment' };
    }
  }

  // Get payment methods (with fallback)
  async getPaymentMethods() {
    try {
      const data = await this._get('/payment-methods');
      return data;
    } catch (err) {
      logger.warn('Falling back to default payment methods due to API error');
      return {
        netbanking: [
          { bank_name: 'HDFC Bank', bank_code: 'HDFC' },
          { bank_name: 'ICICI Bank', bank_code: 'ICIC' },
          { bank_name: 'Axis Bank', bank_code: 'UTIB' },
          { bank_name: 'State Bank of India', bank_code: 'SBIN' },
        ],
        card: { channel: 'card' },
        upi: { channel: 'upi' },
        wallet: [{ channel: 'phonepe' }, { channel: 'paytm' }, { channel: 'amazonpay' }],
      };
    }
  }

  // Refunds
  async refundPayment(orderId, refundId, amount, reason = 'Refund for SafeCheck subscription') {
    try {
      if (!orderId || !refundId || !amount) throw new Error('orderId, refundId and amount are required');

      const payload = {
        refund_amount: amount,
        refund_id: refundId,
        refund_note: reason,
        refund_type: 'MERCHANT_INITIATED',
      };

      const data = await this._post(`/orders/${orderId}/refunds`, payload, { timeout: 20000 });
      logger.info('Refund initiated', { orderId, refundId });
      return { success: true, data };
    } catch (err) {
      logger.error('Cashfree refundPayment error', { orderId, refundId, amount, message: err.message });
      throw new Error(err.response?.data?.message || err.message || 'Refund failed');
    }
  }

  async getRefundStatus(orderId, refundId) {
    try {
      if (!orderId || !refundId) throw new Error('orderId and refundId required');
      const data = await this._get(`/orders/${orderId}/refunds/${refundId}`);
      return data;
    } catch (err) {
      logger.error('Get refund status error', { orderId, refundId, message: err.message });
      throw new Error(err.response?.data?.message || err.message || 'Failed to get refund status');
    }
  }

  // Get order details (raw)
  async getOrderDetails(orderId) {
    try {
      if (!orderId) throw new Error('orderId required');
      const data = await this._get(`/orders/${orderId}`);
      return data.order || data;
    } catch (err) {
      logger.error('Get order details error', { orderId, message: err.message });
      throw new Error(err.response?.data?.message || err.message || 'Failed to get order details');
    }
  }

  // Create subscription (recurring) - best-effort based on Cashfree API shape
  async createSubscription(subscriptionData) {
    try {
      const payload = {
        subscription_id: subscriptionData.subscriptionId,
        plan_id: subscriptionData.planId,
        customer_details: subscriptionData.customerDetails,
        subscription_note: subscriptionData.subscriptionNote || 'SafeCheck recurring subscription',
        auth_amount: subscriptionData.authAmount || 100, // in paise (example)
        expires_on: subscriptionData.expiresOn,
        return_url: process.env.CASHFREE_RETURN_URL,
      };

      const data = await this._post('/subscriptions', payload, { timeout: 20000 });
      return data;
    } catch (err) {
      logger.error('Create subscription error', { message: err.message });
      throw new Error(err.response?.data?.message || err.message || 'Failed to create subscription');
    }
  }

  // Webhook signature verification (pass raw payload string and header signature)
  verifyWebhookSignature(payloadString, signature) {
    try {
      const secret = process.env.CASHFREE_WEBHOOK_SECRET || this.secret || '';
      const generatedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('base64');
      return generatedSignature === signature;
    } catch (err) {
      logger.error('Webhook signature verify error', { message: err.message });
      return false;
    }
  }
}

module.exports = new CashfreeService();
