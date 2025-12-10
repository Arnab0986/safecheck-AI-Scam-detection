import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PaymentButton = ({ plan, amount, onSuccess, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);

  // Load Cashfree SDK dynamically
  useEffect(() => {
    if (!paymentInitialized && window.Cashfree) {
      initializeCashfree();
    } else {
      loadCashfreeSDK();
    }
  }, []);

  const loadCashfreeSDK = () => {
    const script = document.createElement('script');
    script.src = "https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js";
    if (import.meta.env.VITE_CASHFREE_MODE === 'PROD') {
      script.src = "https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js";
    }
    script.onload = () => initializeCashfree();
    document.body.appendChild(script);
  };

  const initializeCashfree = () => {
    if (window.Cashfree) {
      setPaymentInitialized(true);
    }
  };

  const handlePayment = async () => {
    if (!paymentInitialized) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Create order in backend
      const orderResponse = await api.post('/payment/create-production-order', {
        plan,
        amount,
        customerPhone: '9999999999' // In production, get from user input
      });

      const { payment_session_id, payment_url } = orderResponse.data.data.order;

      // Initialize Cashfree Checkout
      const cashfree = new Cashfree();
      
      cashfree.drop({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self", // or "_blank" for new tab
        onSuccess: async (data) => {
          toast.success('Payment successful!');
          
          // Verify payment with backend
          const verifyResponse = await api.post('/payment/verify', {
            orderId: orderResponse.data.data.subscription.cashfreeOrderId
          });

          if (verifyResponse.data.data.status === 'success') {
            toast.success('Subscription activated!');
            if (onSuccess) {
              onSuccess({
                orderId: orderResponse.data.data.subscription.cashfreeOrderId,
                status: 'PAID',
                plan,
                amount
              });
            }
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        onFailure: (data) => {
          toast.error(`Payment failed: ${data.error?.message || 'Unknown error'}`);
          setLoading(false);
        },
        onRedirect: (data) => {
          console.log('Redirecting to:', data.redirectUrl);
        }
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment initialization failed');
      setLoading(false);
    }
  };

  const getPlanFeatures = (plan) => {
    const features = {
      basic: [
        '100 Scans per month',
        'Text & URL Detection',
        'Basic Job Offer Check',
        'Invoice OCR (Premium)',
        'Email Support'
      ],
      premium: [
        '1000 Scans per month',
        'All Basic Features',
        'Invoice OCR Analysis',
        'Priority Support',
        'API Access',
        'Advanced Analytics'
      ],
      enterprise: [
        '10000 Scans per month',
        'All Premium Features',
        'Custom Integration',
        'Dedicated Support',
        'White-label Solution',
        'SLA Guarantee'
      ]
    };
    return features[plan] || features.basic;
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-purple-500 to-purple-600';
      case 'enterprise': return 'from-green-500 to-green-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r ${getPlanColor(plan)} mb-4`}>
          <Shield className="text-white" size={32} />
        </div>
        <h3 className="text-2xl font-bold capitalize">{plan} Plan</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">₹{amount / 100}</span>
          <span className="text-gray-600">/month</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {getPlanFeatures(plan).map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !paymentInitialized}
        className={`w-full btn-primary flex items-center justify-center space-x-2 ${
          loading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Processing...</span>
          </>
        ) : !paymentInitialized ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Loading Payment...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Subscribe Now</span>
          </>
        )}
      </button>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Shield size={16} />
          <span>Secure payment powered by Cashfree</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <CheckCircle size={12} />
          <span>256-bit SSL encryption</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <CheckCircle size={12} />
          <span>PCI DSS compliant</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <CheckCircle size={12} />
          <span>RBI approved payment gateway</span>
        </div>
      </div>

      {!paymentInitialized && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle size={16} />
            <span className="text-sm">Payment system initializing...</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentButton;