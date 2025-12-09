import { useState, useEffect } from 'react'
import { 
  Shield, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import ScanCard from '../components/ScanCard'
import ScoreMeter from '../components/ScoreMeter'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalScans: 0,
    highRiskScans: 0,
    avgRiskScore: 0,
    todayScans: 0
  })
  const [filter, setFilter] = useState('all')
  const { user, subscription } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [filter])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [scansResponse, statsResponse] = await Promise.all([
        api.get('/scan/history', { params: { limit: 10 } }),
        api.get('/scan/stats')
      ])

      setScans(scansResponse.data.data.scans)
      
      if (statsResponse.data.data) {
        setStats(statsResponse.data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const quickScanTypes = [
    { type: 'text', icon: '📝', label: 'Text', color: 'from-blue-500 to-blue-600' },
    { type: 'url', icon: '🔗', label: 'URL', color: 'from-purple-500 to-purple-600' },
    { type: 'job_offer', icon: '💼', label: 'Job Offer', color: 'from-green-500 to-green-600' },
    { type: 'invoice', icon: '🧾', label: 'Invoice', color: 'from-orange-500 to-orange-600' }
  ]

  const riskDistribution = [
    { level: 'Critical', count: 12, color: 'bg-red-500' },
    { level: 'High', count: 8, color: 'bg-orange-500' },
    { level: 'Medium', count: 15, color: 'bg-yellow-500' },
    { level: 'Low', count: 25, color: 'bg-lime-500' },
    { level: 'Safe', count: 40, color: 'bg-green-500' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's your security overview and recent scans
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {subscription?.active ? (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">
                <Zap className="h-4 w-4" />
                <span className="font-medium">PRO</span>
              </div>
            ) : (
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold">{stats.totalScans}</span>
          </div>
          <h3 className="font-semibold mb-1">Total Scans</h3>
          <p className="text-blue-100 text-sm">All time scans performed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8" />
            <span className="text-2xl font-bold">{stats.highRiskScans}</span>
          </div>
          <h3 className="font-semibold mb-1">High Risk</h3>
          <p className="text-purple-100 text-sm">Scans with risk ≥ 60</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-8 w-8" />
            <span className="text-2xl font-bold">{stats.todayScans}</span>
          </div>
          <h3 className="font-semibold mb-1">Today's Scans</h3>
          <p className="text-green-100 text-sm">Scans performed today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8" />
            <span className="text-2xl font-bold">{stats.avgRiskScore}</span>
          </div>
          <h3 className="font-semibold mb-1">Avg Risk Score</h3>
          <p className="text-orange-100 text-sm">Average across all scans</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Actions & Risk Meter */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Scan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Scan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickScanTypes.map((scanType) => (
                <button
                  key={scanType.type}
                  className={`group relative bg-gradient-to-br ${scanType.color} p-4 rounded-xl text-white hover:shadow-lg transition-all duration-300`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                  <div className="relative">
                    <div className="text-2xl mb-2">{scanType.icon}</div>
                    <div className="text-sm font-medium">{scanType.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">
              Your Risk Profile
            </h3>
            <div className="flex flex-col items-center">
              <ScoreMeter score={stats.avgRiskScore} size="lg" />
              <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
                Based on your scan history, your average risk score is{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.avgRiskScore}
                </span>
              </p>
            </div>
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Risk Distribution
              </h3>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {riskDistribution.map((item) => (
                <div key={item.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.level}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.count}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.count}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Recent Scans */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Recent Scans
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Your most recent security scans
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'high-risk', 'text', 'url', 'job', 'invoice'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterType.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            {/* Scans List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Loading scans...</p>
                  </div>
                </div>
              ) : scans.length > 0 ? (
                scans.map((scan, index) => (
                  <motion.div
                    key={scan._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ScanCard scan={scan} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
                    <Shield className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No scans yet
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start by scanning some text, URLs, or images
                  </p>
                  <button className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium">
                    <Plus className="h-5 w-5" />
                    <span>Perform First Scan</span>
                  </button>
                </div>
              )}
            </div>

            {scans.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  View All Scans
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard