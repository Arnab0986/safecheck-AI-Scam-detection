import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, HelpCircle, ExternalLink } from 'lucide-react';

const ScanCard = ({ scan, onClick }) => {
  const getLevelIcon = (level) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'suspicious':
        return <HelpCircle className="text-yellow-500" size={24} />;
      case 'dangerous':
        return <AlertTriangle className="text-red-500" size={24} />;
      default:
        return <HelpCircle className="text-gray-500" size={24} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800';
      case 'dangerous':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="card cursor-pointer hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {getLevelIcon(scan.result.level)}
          <div>
            <h3 className="font-semibold text-lg">
              {scan.type.charAt(0).toUpperCase() + scan.type.slice(1)} Scan
            </h3>
            <p className="text-gray-600 text-sm">
              {formatDate(scan.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(scan.result.level)}`}>
          {scan.result.level.toUpperCase()}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-gray-700 mb-3">
          {truncateText(scan.content)}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{
                color: scan.result.score > 70 ? '#ef4444' : 
                       scan.result.score > 30 ? '#f59e0b' : 
                       '#10b981'
              }}>
                {scan.result.score}/100
              </div>
              <div className="text-xs text-gray-500">Risk Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scan.result.confidence}%
              </div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
          </div>
          
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <span>View Details</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {scan.result.detectedIssues && scan.result.detectedIssues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Detected Issues:</h4>
          <div className="flex flex-wrap gap-2">
            {scan.result.detectedIssues.slice(0, 3).map((issue, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {issue}
              </span>
            ))}
            {scan.result.detectedIssues.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{scan.result.detectedIssues.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ScanCard;