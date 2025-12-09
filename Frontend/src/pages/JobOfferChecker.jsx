import { useState } from 'react'
import { 
  Briefcase, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  MapPin,
  Calendar,
  User,
  Copy,
  Download,
  Share2
} from 'lucide-react'
import { motion } from 'framer-motion'
import ScoreMeter from '../components/ScoreMeter'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const JobOfferChecker = () => {
  const [jobText, setJobText] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [extractedDetails, setExtractedDetails] = useState(null)

  const sampleJobOffers = [
    {
      title: 'Remote Data Entry Clerk',
      content: 'Work from home earning $5000 monthly. No experience needed. Just 2 hours daily. Apply now!',
      risk: 85
    },
    {
      title: 'Software Engineer at TechCorp',
      content: 'TechCorp is hiring experienced software engineers. Competitive salary, benefits, and remote options available.',
      risk: 15
    },
    {
      title: 'Mystery Shopper Needed',
      content: 'Earn quick cash by shopping! We pay $50 per assignment. No fees required.',
      risk: 75
    }
  ]

  const jobRedFlags = [
    'No experience required',
    'Unrealistically high salary',
    'Upfront payment requested',
    'Vague job description',
    'Urgent hiring required',
    'No company website provided',
    'Personal information collection',
    'Payment via gift cards or crypto'
  ]

  const extractJobDetails = (text) => {
    const details = {
      salary: text.match(/\$?\d+[,.]?\d*\s*(k|thousand|million|per\s*(year|month|hour))?/gi)?.[0] || 'Not specified',
      location: text.match(/(remote|hybrid|onsite|work from home)/gi)?.[0] || 'Not specified',
      experience: text.match(/\d+\s*(years?|yrs?)\s*experience/gi)?.[0] || 'Not specified',
      type: text.match(/(full.?time|part.?time|contract|freelance|internship)/gi)?.[0] || 'Not specified'
    }
    setExtractedDetails(details)
  }

  const handleScan = async () => {
    if (!jobText.trim()) {
      toast.error('Please enter job offer text')
      return
    }

    setLoading(true)
    try {
      extractJobDetails(jobText)
      const response = await api.post('/scan/text', {
        text: jobText,
        type: 'job_offer'
      })
      setScanResult(response.data.data.scan)
      toast.success('Job offer analyzed successfully')
    } catch (error) {
      toast.error('Failed to analyze job offer')
    } finally {
      setLoading(false)
    }
  }

  const handleSample = (sample) => {
    setJobText(sample.content)
    extractJobDetails(sample.content)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Job Offer Checker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Verify job offers and protect yourself from employment scams
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input & Samples */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analyze Job Offer
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Paste job description to check for scams
                </p>
              </div>
            </div>

            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job offer description here..."
              className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 resize-none transition-colors"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {jobText.length} characters • {jobText.split(/\s+/).filter(Boolean).length} words
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setJobText('')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleScan}
                  disabled={loading || !jobText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Check for Scams</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Details */}
            {extractedDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Extracted Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Salary</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {extractedDetails.salary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {extractedDetails.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Experience</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {extractedDetails.experience}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {extractedDetails.type}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Samples */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Try with sample job offers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleJobOffers.map((job, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSample(job)}
                    className="text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.title}
                      </span>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        job.risk >= 60 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        job.risk >= 30 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        Risk: {job.risk}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {job.content}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Results & Red Flags */}
        <div className="space-y-8">
          {/* Results Card */}
          {scanResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-6">
                <ScoreMeter score={scanResult.riskScore} size="lg" />
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <h3 className={`text-xl font-bold mb-2 ${
                    scanResult.riskScore >= 60 ? 'text-red-600' :
                    scanResult.riskScore >= 30 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {scanResult.result.isScam ? '⚠️ Likely Scam' : '✅ Likely Legitimate'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {scanResult.result.explanation}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Analysis Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(scanResult.result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {scanResult.result.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Method</span>
                      <span className="font-medium text-gray-900 dark:text-white uppercase">
                        {scanResult.detectionMethod || 'HEURISTIC'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button className="flex-1 flex items-center justify-center space-x-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Copy className="h-4 w-4" />
                    <span>Copy Report</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
                  <Briefcase className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a job offer above to check for scams
                </p>
              </div>
            </motion.div>
          )}

          {/* Red Flags Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Common Job Scam Red Flags
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Warning signs to watch for
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {jobRedFlags.map((flag, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {flag}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stay safe by verifying:
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default JobOfferChecker