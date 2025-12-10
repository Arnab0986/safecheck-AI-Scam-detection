import React from 'react';
import { motion } from 'framer-motion';

const ScoreMeter = ({ score, size = 200, showLabels = true }) => {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score) => {
    if (score >= 70) return '#ef4444'; // Red
    if (score >= 30) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getLevel = (score) => {
    if (score >= 70) return 'Dangerous';
    if (score >= 30) return 'Suspicious';
    return 'Safe';
  };

  const getDescription = (score) => {
    if (score >= 70) return 'High risk detected';
    if (score >= 30) return 'Moderate risk detected';
    return 'Low risk detected';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="12"
          fill="none"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div className="text-4xl font-bold mb-1" style={{ color: getColor(score) }}>
            {score}
          </div>
          <div className="text-sm text-gray-600">Risk Score</div>
        </motion.div>
      </div>

      {/* Labels */}
      {showLabels && (
        <>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
            Safe
          </div>
          <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-xs text-gray-500">
            Suspicious
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
            Dangerous
          </div>
        </>
      )}

      {/* Level indicator */}
      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <div className={`text-lg font-semibold px-4 py-2 rounded-lg inline-block ${
          score >= 70 ? 'bg-red-50 text-red-700' :
          score >= 30 ? 'bg-yellow-50 text-yellow-700' :
          'bg-green-50 text-green-700'
        }`}>
          {getLevel(score)}
        </div>
        <p className="text-gray-600 text-sm mt-2">
          {getDescription(score)}
        </p>
      </div>
    </div>
  );
};

export default ScoreMeter;