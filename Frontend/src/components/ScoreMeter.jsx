import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const ScoreMeter = ({ score, size = 'lg', showLabel = true }) => {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (score) => {
    if (score >= 80) return '#ef4444' // red
    if (score >= 60) return '#f97316' // orange
    if (score >= 40) return '#eab308' // yellow
    if (score >= 20) return '#84cc16' // lime
    return '#22c55e' // green
  }

  const getRiskLevel = (score) => {
    if (score >= 80) return 'Critical'
    if (score >= 60) return 'High'
    if (score >= 40) return 'Medium'
    if (score >= 20) return 'Low'
    return 'Safe'
  }

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return { container: 'h-16 w-16', text: 'text-lg', label: 'text-xs' }
      case 'md':
        return { container: 'h-24 w-24', text: 'text-2xl', label: 'text-sm' }
      case 'lg':
        return { container: 'h-32 w-32', text: 'text-3xl', label: 'text-base' }
      default:
        return { container: 'h-24 w-24', text: 'text-2xl', label: 'text-sm' }
    }
  }

  const sizeClasses = getSizeClasses(size)
  const color = getColor(score)
  const riskLevel = getRiskLevel(score)

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className={`relative ${sizeClasses.container}`}>
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            strokeWidth="8"
            stroke="rgba(0, 0, 0, 0.1)"
            fill="none"
          />
        </svg>

        {/* Animated progress circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <motion.circle
            cx="50%"
            cy="50%"
            r="45"
            strokeWidth="8"
            stroke={color}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              ease: "easeOut"
            }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`font-bold ${sizeClasses.text} text-gray-900 dark:text-white`}
          >
            {Math.round(animatedScore)}
          </motion.div>
          {showLabel && (
            <div className={`font-medium ${sizeClasses.label} mt-1`}>
              {riskLevel}
            </div>
          )}
        </div>

        {/* Glow effect for high risk */}
        {score >= 60 && (
          <div className="absolute inset-0 rounded-full animate-pulse"
            style={{
              boxShadow: `0 0 20px 5px ${color}40`
            }}
          />
        )}
      </div>

      {/* Risk indicator dots */}
      <div className="flex items-center space-x-1 mt-4">
        {[0, 25, 50, 75, 100].map((level) => (
          <div
            key={level}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              score >= level ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              backgroundColor: score >= level ? getColor(level) : '#9ca3af'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default ScoreMeter