import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ScoreMeter from '../components/ScoreMeter';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Briefcase, 
  Building, 
  Mail, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Upload,
  Loader
} from 'lucide-react';

const JobOfferChecker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contact: '',
    salary: '',
    description: ''
  });

  const [requirements, setRequirements] = useState({
    hasTitle: false,
    hasDescription: false,
    hasCompany: false,
    hasContact: false,
    hasSalary: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update requirements
    if (name === 'title') {
      setRequirements(prev => ({ ...prev, hasTitle: value.trim().length > 0 }));
    } else if (name === 'description') {
      setRequirements(prev => ({ ...prev, hasDescription: value.trim().length > 20 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    if (formData.description.trim().length < 20) {
      toast.error('Description should be at least 20 characters');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Analyzing job offer...');
      
      const response = await api.post('/scan/job', formData);
      toast.dismiss();
      toast.success('Analysis completed!');
      
      setResult(response.data.data);
    } catch (error) {
      toast.dismiss();
      const message = error.response?.data?.error || 'Analysis failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      contact: '',
      salary: '',
      description: ''
    });
    setResult(null);
    setRequirements({
      hasTitle: false,
      hasDescription: false,
      hasCompany: false,
      hasContact: false,
      hasSalary: false
    });
  };

  const getScamIndicators = () => {
    const indicators = [
      { text: 'Upfront payment required', weight: 'High' },
      { text: 'Vague company information', weight: 'Medium' },
      { text: 'Personal information requested early', weight: 'High' },
      { text: 'Too-good-to-be-true salary', weight: 'Medium' },
      { text: 'Urgent response required', weight: 'Low' },
      { text: 'Poor grammar and spelling', weight: 'Low' }
    ];
    return indicators;
  };

  const getSafetyTips = () => {
    return [
      'Research the company thoroughly',
      'Never pay money to get a job',
      'Verify contact information',
      'Check for official company email domains',
      'Look for reviews from current/former employees',
      'Trust your instincts'
    ];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Job Offer Checker</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Verify job offers for potential scams and fraudulent activities. Paste the job description below for analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase size={16} className="inline mr-2" />
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building size={16} className="inline mr-2" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Tech Corp Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Contact Email/Phone
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign size={16} className="inline mr-2" />
                    Salary/Compensation
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-2" />
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Paste the complete job description here..."
                  required
                />
                <div className="mt-2 text-sm text-gray-600">
                  {formData.description.length}/5000 characters
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3">Information Checklist</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Job title provided', met: requirements.hasTitle },
                    { label: 'Detailed description (20+ chars)', met: requirements.hasDescription },
                    { label: 'Company name provided', met: formData.company.trim().length > 0 },
                    { label: 'Contact information provided', met: formData.contact.trim().length > 0 },
                    { label: 'Salary/compensation mentioned', met: formData.salary.trim().length > 0 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {item.met ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-yellow-500" />
                      )}
                      <span className={item.met ? 'text-green-700' : 'text-yellow-700'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.description.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Briefcase size={20} />
                      <span>Analyze Job Offer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Right Column - Results & Info */}
        <div className="space-y-6">
          {/* Current Scan Result */}
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-6">Analysis Result</h3>
              
              <div className="text-center mb-6">
                <ScoreMeter score={result.result.score} size={180} />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Risk Level</h4>
                  <div className={`px-4 py-2 rounded-lg text-center font-bold text-lg ${
                    result.result.level === 'safe' ? 'bg-green-100 text-green-800' :
                    result.result.level === 'suspicious' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.result.level.toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Explanation</h4>
                  <p className="text-gray-600 text-sm">
                    {result.result.explanation}
                  </p>
                </div>
                
                {result.result.detectedIssues && result.result.detectedIssues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Detected Issues</h4>
                    <div className="space-y-2">
                      {result.result.detectedIssues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-6">Common Scam Indicators</h3>
              <div className="space-y-4">
                {getScamIndicators().map((indicator, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${
                      indicator.weight === 'High' ? 'text-red-500' :
                      indicator.weight === 'Medium' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium">{indicator.text}</p>
                      <p className="text-xs text-gray-500">Risk: {indicator.weight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Safety Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-green-50 to-blue-50"
          >
            <h3 className="text-xl font-bold mb-6">Safety Tips</h3>
            <div className="space-y-3">
              {getSafetyTips().map((tip, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Scans Remaining</span>
                <span className="font-bold">{user?.scansLeft || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan</span>
                <span className="font-bold capitalize">{user?.subscription || 'free'}</span>
              </div>
              <div className="pt-4">
                <a
                  href="/subscription"
                  className="block text-center btn-primary"
                >
                  Upgrade Plan
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobOfferChecker;