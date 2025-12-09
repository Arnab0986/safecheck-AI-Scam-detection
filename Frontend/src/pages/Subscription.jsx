import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Zap, 
  Shield, 
  Users, 
  Clock,
  Globe,
  BarChart3,
  Star,
  ArrowRight,
  CreditCard,
  BadgeCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import PaymentButton from '../components/PaymentButton'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const Subscription = () => {
  const [activePlan, setActivePlan] = useState('monthly')
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/payment/subscription')
      setSubscription(response.data.data)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const plans = {
    free: {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        '5 scans per day',
        'Basic text analysis',
        'Community support',
        'Limited scan history',
        'Email notifications'
      ],
      color: 'from-gray-400 to-gray-600',
      cta: 'Current Plan',
      disabled: true
    },
    monthly: {
      name: 'Pro Monthly',
      price: '₹9.99',
      period: 'month',
      features: [
        'Unlimited scans',
        'AI-powered detection',
        'Priority email support',
        'Advanced analytics',
        'Extended scan history',
        'PDF report generation',
        'No ads'
      ],
      color: 'from-blue-500 to-blue-600',
      cta: 'Upgrade to Pro',
      popular: true
    },
    yearly: {
      name: 'Pro Yearly',
      price: '₹99.99',
      period: 'year',
      features: [
        'All Pro Monthly features',
        'Save 17% (₹20/year)',
        'Team management (up to 3 users)',
        'API access',
        'Custom detection rules',
        'Priority feature requests',
        'Dedicated account manager'
      ],
      color: 'from-purple-500 to-purple-600',
      cta: 'Get Yearly Plan',
      highlighted: true
    }
  }

  const features = [
    {
      icon: Zap,
      title: 'Unlimited Scans',
      description: 'No daily limits on any type of scan',
      free: '5/day',
      pro: 'Unlimited'
    },
    {
      icon: Shield,
      title: 'AI Detection',
      description: 'Advanced AI-powered scam detection',
      free: 'Basic',
      pro: 'Advanced'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Detailed risk analysis and reports',
      free: 'Limited',
      pro: 'Advanced'
    },
    {
      icon: Users,
      title: 'Support',
      description: 'Get help when you need it',
      free: 'Community',
      pro: 'Priority 24/7'
    },
    {
      icon: Globe,
      title: 'Multi-format',
      description: 'Support for all scan types',
      free: '✓',
      pro: '✓'
    },
    {
      icon: Clock,
      title: 'History',
      description: 'Access to past scans',
      free: '7 days',
      pro: 'Unlimited'
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Small Business Owner',
      content: 'SafeCheck saved me from a sophisticated invoice scam. The Pro plan is worth every penny.',
      rating: 5
    },
    {
      name: 'Rahul Verma',
      role: 'Freelancer',
      content: 'As someone who receives job offers daily, this tool has been invaluable for filtering scams.',
      rating: 5
    },
    {
      name: 'Ananya Patel',
      role: 'University Student',
      content: 'The free plan helped me identify phishing emails targeting students. Upgraded for unlimited scans.',
      rating: 4
    }
  ]

  const handlePaymentSuccess = () => {
    toast.success('Subscription activated successfully!')
    fetchSubscription()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Get comprehensive scam protection with features designed for everyone
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription?.isActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Active Pro Subscription</h3>
                  <p className="text-green-100">
                    You're protected with all Pro features
                    {subscription.daysRemaining > 0 && (
                      <span> • Renews in {subscription.daysRemaining} days</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{subscription.plan?.price}</div>
                <div className="text-green-100">per {subscription.plan?.period}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan Selector */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['free', 'monthly', 'yearly'].map((plan) => (
            <button
              key={plan}
              onClick={() => setActivePlan(plan)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activePlan === plan
                  ? 'bg-white dark:bg-gray-700 shadow-lg text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {plans[plan].name}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {Object.entries(plans).map(([key, plan]) => {
          const isActive = subscription?.isActive && (
            (key === 'free' && !subscription.isActive) ||
            (key === 'monthly' && subscription.plan === 'monthly') ||
            (key === 'yearly' && subscription.plan === 'yearly')
          )

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: key === 'monthly' ? 0.1 : key === 'yearly' ? 0.2 : 0 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                key === activePlan
                  ? 'bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                    BEST VALUE
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-center justify-center mb-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    /{plan.period}
                  </span>
                </div>
                {key === 'yearly' && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Save ₹20 compared to monthly
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {isActive ? (
                  <div className="text-center py-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Current Plan</span>
                    </div>
                  </div>
                ) : key === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <PaymentButton
                    plan={key}
                    onSuccess={handlePaymentSuccess}
                    className="w-full"
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Feature Comparison */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Feature Comparison
        </h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-6 font-semibold text-gray-900 dark:text-white">Feature</div>
            <div className="p-6 text-center font-semibold text-gray-900 dark:text-white">Free</div>
            <div className="p-6 text-center font-semibold text-blue-600 dark:text-blue-400">Pro Monthly</div>
            <div className="p-6 text-center font-semibold text-purple-600 dark:text-purple-400">Pro Yearly</div>
          </div>

          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`grid grid-cols-4 ${
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                }`}
              >
                <div className="p-6 flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {feature.free}
                  </span>
                </div>
                <div className="p-6 flex items-center justify-center">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {feature.pro}
                  </span>
                </div>
                <div className="p-6 flex items-center justify-center">
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {feature.pro}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Testimonials */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Trusted by Users Worldwide
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {testimonial.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              q: 'Can I cancel my subscription anytime?',
              a: 'Yes, you can cancel your subscription at any time. Your Pro features will remain active until the end of your billing period.'
            },
            {
              q: 'Is there a free trial for Pro features?',
              a: 'No free trial, but you can use our Free plan indefinitely to test basic features before upgrading.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit/debit cards, UPI, net banking, and popular digital wallets through Cashfree.'
            },
            {
              q: 'Can I upgrade from Monthly to Yearly?',
              a: 'Yes, you can upgrade anytime. The remaining value of your current plan will be prorated.'
            },
            {
              q: 'Is my payment information secure?',
              a: 'Absolutely. We use Cashfree for payment processing and never store your payment details on our servers.'
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 14-day money-back guarantee if you\'re not satisfied with the Pro features.'
            }
          ].map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {faq.q}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Stay Protected?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust SafeCheck to protect them from scams, 
            fraud, and phishing attempts every day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <PaymentButton
              plan="monthly"
              className="px-8 py-4 text-lg"
              onSuccess={handlePaymentSuccess}
            />
            <PaymentButton
              plan="yearly"
              className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
              onSuccess={handlePaymentSuccess}
            />
          </div>
          <p className="text-blue-100 text-sm mt-6">
            No credit card required for Free plan • 14-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}

export default Subscription