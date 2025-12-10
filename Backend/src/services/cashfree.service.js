const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || 'test_app_id';
    this.secret = process.env.CASHFREE_SECRET || 'test_secret_key';
    this.mode = process.env.CASHFREE_MODE || 'TEST';
    this.mock = process.env.MOCK_CASHFREE === 'true';
    
    this.baseUrl = this.mode === 'PROD' 
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
    
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-version': '2022-09-01',
      'x-client-id': this.appId,
      'x-client-secret': this.secret
    };
  }

  async createOrder(orderData) {
    try {
      if (this.mock) {
        return this.mockCreateOrder(orderData);
      }

      const response = await axios.post(
        `${this.baseUrl}/orders`,
        orderData,
        { headers: this.headers }
      );

      logger.info(`Cashfree order created: ${orderData.orderId}`);
      return response.data;

    } catch (error) {
      logger.error(`Cashfree create order error: ${error.message}`);
      throw new Error('Failed to create order with payment gateway');
    }
  }

  async verifyPayment(orderId) {
    try {
      if (this.mock) {
        return this.mockVerifyPayment(orderId);
      }

      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.headers }
      );

      const order = response.data;
      return order.order_status === 'PAID' ? 'PAID' : 'FAILED';

    } catch (error) {
      logger.error(`Cashfree verify payment error: ${error.message}`);
      return 'FAILED';
    }
  }

  async getPaymentMethods() {
    try {
      if (this.mock) {
        return this.mockGetPaymentMethods();
      }

      const response = await axios.get(
        `${this.baseUrl}/payment-methods`,
        { headers: this.headers }
      );

      return response.data;

    } catch (error) {
      logger.error(`Cashfree get payment methods error: ${error.message}`);
      return this.mockGetPaymentMethods();
    }
  }

  async refundPayment(orderId, amount) {
    try {
      if (this.mock) {
        return this.mockRefundPayment(orderId, amount);
      }

      const refundId = `REFUND_${Date.now()}`;
      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        {
          refund_amount: amount,
          refund_id: refundId,
          refund_note: 'Refund for SafeCheck subscription'
        },
        { headers: this.headers }
      );

      logger.info(`Cashfree refund initiated: ${refundId}`);
      return response.data;

    } catch (error) {
      logger.error(`Cashfree refund error: ${error.message}`);
      throw new Error('Failed to process refund');
    }
  }

  // Mock implementations for development
  mockCreateOrder(orderData) {
    logger.info(`Mock: Creating order ${orderData.orderId}`);
    
    return {
      order_id: orderData.orderId,
      payment_session_id: `mock_session_${Date.now()}`,
      order_token: `mock_token_${Date.now()}`,
      payment_url: `${this.baseUrl === 'https://sandbox.cashfree.com/pg' ? 'https://sandbox.cashfree.com' : 'https://www.cashfree.com'}/mock/pay/${orderData.orderId}`,
      cf_order_id: `mock_cf_${Date.now()}`,
      order_status: 'ACTIVE',
      order_amount: orderData.orderAmount,
      order_currency: orderData.orderCurrency,
      customer_details: orderData.customerDetails
    };
  }

  mockVerifyPayment(orderId) {
    logger.info(`Mock: Verifying payment for order ${orderId}`);
    
    // Simulate payment verification - 80% success rate in mock
    const isPaid = Math.random() > 0.2;
    return isPaid ? 'PAID' : 'FAILED';
  }

  mockGetPaymentMethods() {
    return {
      netbanking: [
        { bank_name: 'HDFC Bank' },
        { bank_name: 'ICICI Bank' },
        { bank_name: 'Axis Bank' },
        { bank_name: 'State Bank of India' }
      ],
      card: [
        { channel: 'card' }
      ],
      upi: [
        { channel: 'upi' }
      ],
      wallet: [
        { channel: 'phonepe' },
        { channel: 'paytm' },
        { channel: 'amazonpay' }
      ]
    };
  }

  mockRefundPayment(orderId, amount) {
    logger.info(`Mock: Refunding ${amount} for order ${orderId}`);
    
    return {
      refund_id: `mock_refund_${Date.now()}`,
      order_id: orderId,
      refund_amount: amount,
      refund_status: 'SUCCESS',
      refund_note: 'Mock refund processed'
    };
  }

  verifyWebhookSignature(payload, signature) {
    if (this.mock) {
      return true; // Always valid in mock mode
    }

    const calculatedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64');

    return calculatedSignature === signature;
  }
}

module.exports = new CashfreeService();