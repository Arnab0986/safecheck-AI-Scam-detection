import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PaymentButton from '../components/PaymentButton';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Shield,
  CheckCircle,
  Zap,
  Globe,
  Lock,
  Users,
  Star,
  CreditCard,
  RefreshCw,
  Award,
  TrendingUp
} from 'lucide-react';

const Subscription = () => {
  const { user, subscription, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly');

  const plans = {
    monthly: [
      {
        name: 'free',
        price: 0,
        features: [
          { text: '10 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: false },
          { text: 'API Access', included: false },
          { text: 'Priority Support', included: false },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-gray-400 to-gray-600',
        popular: false
      },
      {
        name: 'basic',
        price: 499,
        features: [
          { text: '100 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: false },
          { text: 'Priority Support', included: false },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-blue-500 to-blue-600',
        popular: false
      },
      {
        name: 'premium',
        price: 1499,
        features: [
          { text: '1000 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: true },
          { text: 'Priority Support', included: true },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-purple-500 to-purple-600',
        popular: true
      },
      {
        name: 'enterprise',
        price: 4999,
        features: [
          { text: '10000 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: true },
          { text: 'Priority Support', included: true },
          { text: 'Custom Integration', included: true },
          { text: 'Advanced Analytics', included: true }
        ],
        color: 'from-green-500 to-green-600',
        popular: false
      }
    ],
    yearly: [
      {
        name: 'free',
        price: 0,
        features: [
          { text: '10 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: false },
          { text: 'API Access', included: false },
          { text: 'Priority Support', included: false },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-gray-400 to-gray-600',
        popular: false
      },
      {
        name: 'basic',
        price: 4788,
        features: [
          { text: '100 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: false },
          { text: 'Priority Support', included: false },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-blue-500 to-blue-600',
        popular: false,
        note: 'Save 20%'
      },
      {
        name: 'premium',
        price: 14388,
        features: [
          { text: '1000 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: true },
          { text: 'Priority Support', included: true },
          { text: 'Custom Integration', included: false },
          { text: 'Advanced Analytics', included: false }
        ],
        color: 'from-purple-500 to-purple-600',
        popular: true,
        note: 'Save 20%'
      },
      {
        name: 'enterprise',
        price: 47988,
        features: [
          { text: '10000 Scans per month', included: true },
          { text: 'Text & URL Detection', included: true },
          { text: 'Basic Job Offer Check', included: true },
          { text: 'Invoice OCR Analysis', included: true },
          { text: 'API Access', included: true },
          { text: 'Priority Support', included: true },
          { text: 'Custom Integration', included: true },
          { text: 'Advanced Analytics', included: true }
        ],
        color: 'from-green-500 to-green-600',
        popular: false,
        note: 'Save 20%'
      }
    ]
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setLoading(true);
      
      // Verify payment with backend
      const response = await api.post('/payment/verify', {
        orderId: paymentData.orderId
      });
      
      if (response.data.data.status === 'success') {
        toast.success('Subscription activated successfully!');
        await fetchUserProfile();
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlanIndex = () => {
    const currentPlans = plans[activeTab];
    return currentPlans.findIndex(plan => plan.name === user?.subscription);
  };

  const currentPlanIndex = getCurrentPlanIndex();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your scam detection needs. All plans include our 
          advanced AI detection and heuristic analysis.
        </p>
        
        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'monthly'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'yearly'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly Billing
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Current Plan Banner */}
      {user?.subscription && user.subscription !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Your Current Plan</h3>
                <p className="text-blue-100">
                  {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} Plan • {
                    subscription?.endDate 
                      ? `Renews on ${new Date(subscription.endDate).toLocaleDateString()}`
                      : 'Active'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{user.scansLeft}</div>
                <div className="text-sm text-blue-200">Scans Left</div>
              </div>
              <button
                onClick={fetchUserProfile}
                disabled={loading}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans[activeTab].map((plan, index) => {
          const isCurrentPlan = plan.name === user?.subscription;
          const isUpgrade = currentPlanIndex < index;
          
          return (
            <motion.div
              key={`${activeTab}-${plan.name}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative card ${plan.popular ? 'ring-2 ring-purple-500' : ''} ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`h-16 w-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Shield className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold capitalize">{plan.name} Plan</h3>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold">₹</span>
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 ml-2">/{activeTab === 'yearly' ? 'year' : 'month'}</span>
                    )}
                  </div>
                  {plan.note && (
                    <div className="mt-2 text-green-600 font-medium">
                      {plan.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    {feature.included ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.price === 0 ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Free Plan
                  </button>
                ) : (
                  <PaymentButton
                    plan={plan.name}
                    amount={plan.price}
                    onSuccess={handlePaymentSuccess}
                    className="w-full"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4">Features</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4">Basic</th>
                <th className="text-center p-4">Premium</th>
                <th className="text-center p-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Monthly Scans', free: '10', basic: '100', premium: '1000', enterprise: '10000' },
                { feature: 'Text Detection', free: true, basic: true, premium: true, enterprise: true },
                { feature: 'URL Detection', free: true, basic: true, premium: true, enterprise: true },
                { feature: 'Job Offer Check', free: true, basic: true, premium: true, enterprise: true },
                { feature: 'Invoice OCR', free: false, basic: true, premium: true, enterprise: true },
                { feature: 'API Access', free: false, basic: false, premium: true, enterprise: true },
                { feature: 'Priority Support', free: false, basic: false, premium: true, enterprise: true },
                { feature: 'Custom Integration', free: false, basic: false, premium: false, enterprise: true },
                { feature: 'Advanced Analytics', free: false, basic: false, premium: false, enterprise: true }
              ].map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="text-center p-4">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <CheckCircle className="text-green-500 mx-auto" size={20} /> : '—'
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="text-center p-4">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? <CheckCircle className="text-green-500 mx-auto" size={20} /> : '—'
                    ) : (
                      row.basic
                    )}
                  </td>
                  <td className="text-center p-4">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <CheckCircle className="text-green-500 mx-auto" size={20} /> : '—'
                    ) : (
                      row.premium
                    )}
                  </td>
                  <td className="text-center p-4">
                    {typeof row.enterprise === 'boolean' ? (
                      row.enterprise ? <CheckCircle className="text-green-500 mx-auto" size={20} /> : '—'
                    ) : (
                      row.enterprise
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: 'Can I upgrade or downgrade my plan?',
              a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.'
            },
            {
              q: 'What happens if I exceed my scan limit?',
              a: 'You can purchase additional scans or upgrade your plan to continue using the service.'
            },
            {
              q: 'Is there a free trial for paid plans?',
              a: 'All paid plans come with a 7-day free trial. No credit card required to start.'
            },
            {
              q: 'How secure is my data?',
              a: 'We use industry-standard encryption and never share your data with third parties.'
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, you can cancel anytime. You’ll continue to have access until the end of your billing period.'
            },
            {
              q: 'Do you offer discounts for non-profits?',
              a: 'Yes, we offer special pricing for registered non-profit organizations. Contact our sales team.'
            }
          ].map((faq, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold text-lg">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Security?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of users who trust SafeCheck for their online safety.
            Start with a free plan and upgrade when you need more features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.subscription === 'free' ? (
              <button
                onClick={() => setActiveTab('monthly')}
                className="btn-primary"
              >
                Upgrade Now
              </button>
            ) : (
              <a href="/dashboard" className="btn-primary">
                Go to Dashboard
              </a>
            )}
            <a href="/contact" className="btn-secondary">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;