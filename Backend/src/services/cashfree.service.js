const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID;
    this.secret = process.env.CASHFREE_SECRET;
    this.mode = process.env.CASHFREE_MODE || 'PROD';
    
    // Production endpoints
    this.baseUrl = 'https://api.cashfree.com/pg';
    this.checkoutUrl = 'https://pay.cashfree.com';
    
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-version': '2022-09-01',
      'x-client-id': this.appId,
      'x-client-secret': this.secret
    };
  }

  async createOrder(orderData) {
    try {
      // Validate required fields
      const requiredFields = ['orderId', 'orderAmount', 'customerDetails'];
      requiredFields.forEach(field => {
        if (!orderData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      });

      // Add additional production parameters
      const productionOrderData = {
        ...orderData,
        orderCurrency: 'INR',
        orderNote: `SafeCheck Subscription - ${orderData.orderId}`,
        customerDetails: {
          customerId: orderData.customerDetails.customerId,
          customerEmail: orderData.customerDetails.customerEmail,
          customerPhone: orderData.customerDetails.customerPhone || '9999999999',
          customerName: orderData.customerDetails.customerName
        },
        orderMeta: {
          returnUrl: `${process.env.CASHFREE_RETURN_URL}?order_id={order_id}`,
          notifyUrl: process.env.CASHFREE_WEBHOOK_NOTIFY_URL,
          paymentMethods: 'cc,dc,upi,nb,wallet,paylater'
        },
        orderExpiryTime: '2029-03-10T12:00:00Z', // Set expiry to 30 minutes from now
        orderTags: {
          subscription: 'true',
          plan: orderData.orderMeta?.plan || 'basic'
        }
      };

      logger.info(`Creating Cashfree order: ${productionOrderData.orderId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        productionOrderData,
        {
          headers: this.headers,
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.payment_session_id) {
        logger.info(`Order created successfully: ${productionOrderData.orderId}`);
        return {
          success: true,
          data: {
            ...response.data,
            payment_url: `${this.checkoutUrl}/pay/${response.data.payment_session_id}`
          }
        };
      } else {
        throw new Error('Failed to create payment session');
      }

    } catch (error) {
      logger.error(`Cashfree create order error: ${error.message}`, {
        orderId: orderData?.orderId,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid Cashfree credentials');
      } else if (error.response?.status === 400) {
        throw new Error(`Validation error: ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }

  async verifyPayment(orderId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        {
          headers: this.headers,
          timeout: 5000
        }
      );

      const order = response.data;
      
      // Detailed status check
      if (order.order_status === 'PAID') {
        return {
          status: 'PAID',
          order: order,
          paymentDetails: order.payment_details
        };
      } else if (order.order_status === 'ACTIVE') {
        return {
          status: 'PENDING',
          order: order
        };
      } else {
        return {
          status: 'FAILED',
          order: order,
          reason: order.order_status
        };
      }

    } catch (error) {
      logger.error(`Cashfree verify payment error: ${error.message}`, {
        orderId,
        status: error.response?.status
      });
      
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  async getPaymentMethods() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment-methods`,
        {
          headers: this.headers,
          timeout: 5000
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Get payment methods error: ${error.message}`);
      
      // Return default payment methods if API fails
      return {
        netbanking: [
          { bank_name: 'HDFC Bank', bank_code: 'HDFC' },
          { bank_name: 'ICICI Bank', bank_code: 'ICIC' },
          { bank_name: 'Axis Bank', bank_code: 'UTIB' },
          { bank_name: 'State Bank of India', bank_code: 'SBIN' }
        ],
        card: { channel: 'card' },
        upi: { channel: 'upi' },
        wallet: [
          { channel: 'phonepe' },
          { channel: 'paytm' },
          { channel: 'amazonpay' }
        ]
      };
    }
  }

  async refundPayment(orderId, refundId, amount, reason = 'Refund for SafeCheck subscription') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/orders/${orderId}/refunds`,
        {
          refund_amount: amount,
          refund_id: refundId,
          refund_note: reason,
          refund_type: 'MERCHANT_INITIATED'
        },
        {
          headers: this.headers,
          timeout: 10000
        }
      );

      logger.info(`Refund initiated: ${refundId} for order ${orderId}`);
      
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error(`Cashfree refund error: ${error.message}`, {
        orderId,
        refundId,
        amount
      });
      
      throw new Error(`Refund failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRefundStatus(orderId, refundId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}/refunds/${refundId}`,
        {
          headers: this.headers,
          timeout: 5000
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Get refund status error: ${error.message}`);
      throw new Error('Failed to get refund status');
    }
  }

  // Webhook signature verification
  verifyWebhookSignature(payload, signature) {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET || this.secret)
        .update(payload)
        .digest('base64');

      return generatedSignature === signature;

    } catch (error) {
      logger.error(`Webhook signature verification error: ${error.message}`);
      return false;
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        {
          headers: this.headers,
          timeout: 5000
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Get order details error: ${error.message}`);
      throw new Error('Failed to get order details');
    }
  }

  // Create subscription (for recurring payments)
  async createSubscription(subscriptionData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscriptions`,
        {
          subscription_id: subscriptionData.subscriptionId,
          plan_id: subscriptionData.planId,
          customer_details: subscriptionData.customerDetails,
          subscription_note: 'SafeCheck recurring subscription',
          auth_amount: subscriptionData.authAmount || 100, // Authorization amount in paise
          expires_on: subscriptionData.expiresOn,
          return_url: process.env.CASHFREE_RETURN_URL
        },
        {
          headers: this.headers,
          timeout: 10000
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Create subscription error: ${error.message}`);
      throw new Error('Failed to create subscription');
    }
  }
}

module.exports = new CashfreeService();