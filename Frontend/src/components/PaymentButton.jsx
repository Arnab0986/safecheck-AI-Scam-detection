import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentButton = ({ plan, amount, onSuccess, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // In production, this would integrate with Cashfree SDK
      // For demo purposes, we'll simulate payment
      
      toast.loading('Processing payment...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      toast.dismiss();
      toast.success('Payment successful!');
      
      if (onSuccess) {
        onSuccess({
          orderId: `ORDER_${Date.now()}`,
          status: 'PAID',
          plan,
          amount
        });
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (plan) => {
    const features = {
      basic: [
        '100 Scans per month',
        'Text & URL Detection',
        'Basic Job Offer Check',
        'Email Support'
      ],
      premium: [
        '1000 Scans per month',
        'All Basic Features',
        'Invoice OCR Analysis',
        'Priority Support',
        'API Access'
      ],
      enterprise: [
        '10000 Scans per month',
        'All Premium Features',
        'Custom Integration',
        'Dedicated Support',
        'Advanced Analytics'
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
          <span className="text-4xl font-bold">₹{amount}</span>
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
        disabled={loading}
        className={`w-full btn-primary flex items-center justify-center space-x-2 ${
          loading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Subscribe Now</span>
          </>
        )}
      </button>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Shield size={16} />
          <span>Secure payment powered by Cashfree</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>
    </motion.div>
  );
};

export default PaymentButton;