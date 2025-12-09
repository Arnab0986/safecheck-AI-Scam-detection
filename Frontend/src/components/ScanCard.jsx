import { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Info,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import ScoreMeter from './ScoreMeter'

const ScanCard = ({ scan, expanded: initiallyExpanded = false }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  
  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (score >= 60) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    if (score >= 20) return 'text-lime-600 bg-lime-50 dark:bg-lime-900/20'
    return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }

  const getRiskIcon = (score) => {
    if (score >= 60) return AlertTriangle
    if (score >= 20) return Shield
    return CheckCircle
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'url':
        return ExternalLink
      case 'job_offer':
        return '💼'
      case 'invoice':
        return '🧾'
      case 'ocr':
        return '📷'
      default:
        return '📝'
    }
  }

  const RiskIcon = getRiskIcon(scan.riskScore)
  const typeIcon = getTypeIcon(scan.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Card Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${getRiskColor(scan.riskScore)}`}>
              <RiskIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {scan.type.replace('_', ' ').toUpperCase()} Scan
                </span>
                <span className="text-2xl">{typeIcon}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                </span>
                {scan.detectionMethod === 'ai' && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs">
                    AI Analysis
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ScoreMeter score={scan.riskScore} size="md" />
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 space-y-6">
              {/* Risk Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Risk Analysis
                  </h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {scan.result.explanation}
                </p>
              </div>

              {/* Indicators */}
              {scan.result.indicators && scan.result.indicators.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Red Flags Detected
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {scan.result.indicators.slice(0, 6).map((indicator, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {indicator}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {scan.result.recommendations && scan.result.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {scan.result.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      >
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {recommendation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Content Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Scanned Content
                </h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono line-clamp-3">
                    {scan.content}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {(scan.result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {scan.result.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scam</p>
                  <p className={`font-semibold ${scan.result.isScam ? 'text-red-600' : 'text-green-600'}`}>
                    {scan.result.isScam ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Method</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {scan.detectionMethod?.toUpperCase() || 'HEURISTIC'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ScanCard