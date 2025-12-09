import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Globe, 
  FileText, 
  Camera, 
  CheckCircle,
  BarChart3,
  Lock,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import ScanCard from '../components/ScanCard'
import PaymentButton from '../components/PaymentButton'

const Home = () => {
  const [activeFeature, setActiveFeature] = useState(0)
  const { user } = useAuth()

  const features = [
    {
      icon: FileText,
      title: 'Text Analysis',
      description: 'Analyze messages, emails, and documents for scam indicators',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Globe,
      title: 'URL Scanning',
      description: 'Check URLs and links for phishing and malicious content',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '💼',
      title: 'Job Offer Checker',
      description: 'Verify job offers and identify employment scams',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Camera,
      title: 'Image OCR',
      description: 'Extract and analyze text from images and documents',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const stats = [
    { value: '99.7%', label: 'Detection Accuracy', icon: BarChart3 },
    { value: '50K+', label: 'Scans Daily', icon: Zap },
    { value: '24/7', label: 'Real-time Protection', icon: Shield },
    { value: '10K+', label: 'Users Protected', icon: Users }
  ]

  const demoScans = [
    {
      id: '1',
      type: 'url',
      content: 'http://secure-bank-update.com/login',
      riskScore: 92,
      result: {
        isScam: true,
        confidence: 0.95,
        category: 'phishing',
        explanation: 'High-risk phishing URL detected. Domain mimics legitimate banking site.',
        indicators: ['Suspicious domain name', 'HTTPS not properly configured', 'Recently registered'],
        recommendations: ['Do not enter any credentials', 'Report to your bank', 'Use official banking app']
      },
      detectionMethod: 'ai',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      type: 'job_offer',
      content: 'Work from home earning $5000 monthly. No experience needed.',
      riskScore: 78,
      result: {
        isScam: true,
        confidence: 0.88,
        category: 'job_scam',
        explanation: 'Common job scam pattern detected. Promises unrealistic earnings.',
        indicators: ['Unrealistic salary', 'No experience required', 'Vague job description'],
        recommendations: ['Research the company', 'Never pay upfront fees', 'Verify through official channels']
      },
      detectionMethod: 'heuristic',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: '3',
      type: 'text',
      content: 'Your account has been suspended. Click here to verify.',
      riskScore: 65,
      result: {
        isScam: true,
        confidence: 0.82,
        category: 'phishing',
        explanation: 'Urgency tactics used to pressure immediate action.',
        indicators: ['Creates sense of urgency', 'Requests immediate action', 'Generic greeting'],
        recommendations: ['Check account directly', 'Do not click links', 'Contact support directly']
      },
      detectionMethod: 'ai',
      createdAt: new Date(Date.now() - 10800000).toISOString()
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Scam Detection</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Stay Safe
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                from Digital Scams
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10"
            >
              Protect yourself from phishing, fraud, and scams across text, URLs, 
              job offers, and images with our AI-powered detection system.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-75 transition-opacity" />
                    <span className="relative flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Go to Dashboard</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <Link
                    to="/subscription"
                    className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    Upgrade to Pro
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-75 transition-opacity" />
                    <span className="relative flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Get Started Free</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comprehensive Protection
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Detect scams across multiple formats with AI-powered analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isString = typeof Icon === 'string'
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl'
                    : 'bg-white/50 dark:bg-gray-800/50 shadow-lg hover:shadow-xl'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 transition-opacity ${
                  activeFeature === index ? 'opacity-5' : ''
                }`} />
                
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-6`}>
                    {isString ? (
                      <span className="text-2xl">{Icon}</span>
                    ) : (
                      <Icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Demo Scans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See SafeCheck in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Real examples of scam detection across different formats
          </p>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {demoScans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ScanCard scan={scan} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium mb-8"
            >
              <Lock className="h-4 w-4" />
              <span>Secure Your Digital Life</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Start Protecting Yourself Today
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Join thousands of users who trust SafeCheck to keep them safe from digital threats.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Free Plan
                  </h3>
                  <div className="text-4xl font-bold mb-6">
                    ₹0<span className="text-lg text-gray-500">/forever</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['5 scans per day', 'Basic detection', 'Email support', 'Community access'].map((item) => (
                      <li key={item} className="flex items-center text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="block w-full py-3 text-center border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {user ? 'Go to Dashboard' : 'Get Started Free'}
                  </Link>
                </div>

                <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Pro Plan
                  </h3>
                  <div className="text-4xl font-bold text-white mb-6">
                    ₹9.99<span className="text-lg text-white/80">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['Unlimited scans', 'AI-powered detection', 'Priority support', 'Advanced analytics', 'Team features'].map((item) => (
                      <li key={item} className="flex items-center text-white/90">
                        <CheckCircle className="h-5 w-5 text-white mr-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <PaymentButton 
                    plan="monthly"
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home