const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secret = process.env.CASHFREE_SECRET;
    this.mode = process.env.CASHFREE_MODE || 'TEST';
    this.mock = process.env.MOCK_CASHFREE === 'true';
    
    this.baseUrl = this.mode === 'PRODUCTION' 
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com';
    
    this.apiVersion = '2023-08-01';
  }

  /**
   * Create a new payment order
   */
  async createOrder(orderData) {
    if (this.mock) {
      return this.mockCreateOrder(orderData);
    }

    try {
      const url = `${this.baseUrl}/pg/orders`;
      
      const payload = {
        order_id: orderData.order_id,
        order_amount: orderData.order_amount,
        order_currency: orderData.order_currency,
        customer_details: orderData.customer_details,
        order_meta: {
          ...orderData.order_meta,
          notify_url: `${process.env.BACKEND_URL}/api/v1/payment/webhook`
        },
        order_note: orderData.order_note || 'SafeCheck Subscription'
      };

      const response = await axios.post(url, payload, {
        headers: this.getHeaders()
      });

      logger.info(`Cashfree order created: ${orderData.order_id}`);
      return response.data;
    } catch (error) {
      logger.error('Cashfree create order error:', error.response?.data || error.message);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId) {
    if (this.mock) {
      return this.mockGetPaymentStatus(orderId);
    }

    try {
      const url = `${this.baseUrl}/pg/orders/${orderId}`;
      const response = await axios.get(url, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      logger.error('Cashfree get payment status error:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(orderId, paymentId) {
    if (this.mock) {
      return this.mockVerifyPayment(orderId);
    }

    try {
      const url = `${this.baseUrl}/pg/orders/${orderId}/payments/${paymentId}`;
      const response = await axios.get(url, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      logger.error('Cashfree verify payment error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(signature, payload) {
    if (this.mock) return true;

    try {
      const payloadString = JSON.stringify(payload);
      const computedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(payloadString)
        .digest('base64');

      return signature === computedSignature;
    } catch (error) {
      logger.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get API headers
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-version': this.apiVersion,
      'x-client-id': this.appId,
      'x-client-secret': this.secret
    };
  }

  /**
   * Mock implementation for testing
   */
  async mockCreateOrder(orderData) {
    logger.info('Mock: Creating Cashfree order', orderData.order_id);
    
    return {
      order_id: orderData.order_id,
      payment_session_id: `mock_session_${Date.now()}`,
      order_amount: orderData.order_amount,
      order_currency: orderData.order_currency,
      order_status: 'ACTIVE',
      payment_link: `https://sandbox.cashfree.com/pg/orders/${orderData.order_id}`,
      customer_details: orderData.customer_details,
      order_meta: orderData.order_meta
    };
  }

  /**
   * Mock payment status
   */
  async mockGetPaymentStatus(orderId) {
    logger.info('Mock: Getting payment status', orderId);
    
    // Simulate different statuses based on order ID
    const statuses = ['PAID', 'PENDING', 'FAILED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      order_id: orderId,
      order_status: randomStatus,
      payment_status: randomStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
      cf_payment_id: randomStatus === 'PAID' ? `mock_payment_${Date.now()}` : null,
      payment_amount: randomStatus === 'PAID' ? 999 : null,
      payment_time: randomStatus === 'PAID' ? new Date().toISOString() : null,
      payment_method: randomStatus === 'PAID' ? 'card' : null
    };
  }

  /**
   * Mock payment verification
   */
  async mockVerifyPayment(orderId) {
    logger.info('Mock: Verifying payment', orderId);
    
    return {
      order_id: orderId,
      order_status: 'PAID',
      payment_status: 'SUCCESS',
      cf_payment_id: `mock_payment_${Date.now()}`,
      payment_amount: 999,
      payment_time: new Date().toISOString(),
      payment_method: 'card'
    };
  }

  /**
   * Get Cashfree SDK configuration
   */
  getSDKConfig() {
    return {
      appId: this.appId,
      mode: this.mode.toLowerCase(),
      currency: 'INR',
      style: {
        theme: 'light',
        backgroundColor: '#ffffff',
        buttonColor: '#4f46e5',
        buttonTextColor: '#ffffff'
      }
    };
  }
}

module.exports = new CashfreeService();