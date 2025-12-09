import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const PaymentButton = ({ plan = 'monthly', className = '', onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Load Cashfree SDK
    if (window.Cashfree) {
      window.Cashfree.init({
        mode: import.meta.env.VITE_CASHFREE_MODE || "TEST"
      })
    }
  }, [])

  const planDetails = {
    monthly: {
      name: 'Monthly',
      price: '₹9.99',
      period: 'month',
      features: ['Unlimited scans', 'Priority support', 'AI-powered detection'],
      color: 'from-blue-500 to-blue-600'
    },
    yearly: {
      name: 'Yearly',
      price: '₹99.99',
      period: 'year',
      features: ['All monthly features', 'Save 17%', 'Team management'],
      color: 'from-purple-500 to-purple-600'
    }
  }

  const details = planDetails[plan]

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    setLoading(true)

    try {
      // Create order
      const response = await api.post('/payment/create-order', { plan })
      const { payment_session_id } = response.data.data

      // Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        returnUrl: `${window.location.origin}/payment/callback`,
        redirectTarget: "_self"
      }

      window.Cashfree.checkout(checkoutOptions)
        .then(async (result) => {
          if (result.error) {
            toast.error(result.error.message || 'Payment failed')
            return
          }

          if (result.redirect) {
            // Payment redirected (net banking, UPI, etc.)
            return
          }

          // Payment completed successfully
          if (result.paymentDetails?.paymentStatus === 'SUCCESS') {
            // Verify payment
            await api.post('/payment/verify', {
              order_id: result.orderId
            })

            toast.success('Subscription activated successfully!')
            if (onSuccess) onSuccess()
          }
        })
        .catch((error) => {
          console.error('Checkout error:', error)
          toast.error('Payment processing failed')
        })
        .finally(() => {
          setLoading(false)
        })

    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handlePayment}
      disabled={loading}
      className={`relative overflow-hidden group ${className}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${details.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center space-x-3 px-8 py-4 rounded-lg">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <span className="font-semibold text-white">Processing...</span>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-white" />
              <Shield className="h-5 w-5 text-white/80" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white text-lg">
                {details.price}
                <span className="text-sm font-normal opacity-90">/{details.period}</span>
              </div>
              <div className="text-white/90 text-sm flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </div>
            </div>
          </>
        )}
      </div>

      {/* Features popup on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[200px] border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Includes:
          </div>
          <ul className="space-y-1">
            {details.features.map((feature, index) => (
              <li key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.button>
  )
}

export default PaymentButton