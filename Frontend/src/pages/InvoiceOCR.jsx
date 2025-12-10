import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ScoreMeter from '../components/ScoreMeter';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Loader,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

const InvoiceOCR = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    // Check if user has OCR access
    if (!['premium', 'enterprise'].includes(user?.subscription)) {
      toast.error('OCR feature requires premium subscription');
      return;
    }

    const formData = new FormData();
    formData.append('invoice', selectedFile);

    try {
      setUploading(true);
      toast.loading('Uploading and processing invoice...');

      const response = await api.post('/ocr/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.dismiss();
      toast.success('Invoice processed successfully!');

      setResult(response.data.data);
      setExtractedText(response.data.data.extractedText);
    } catch (error) {
      toast.dismiss();
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResult = () => {
    if (!result) return;

    const data = {
      scanId: result.scanId,
      score: result.result.score,
      level: result.result.level,
      explanation: result.result.explanation,
      detectedIssues: result.result.detectedIssues,
      extractedText: extractedText,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safecheck-invoice-result-${result.scanId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getInvoiceIndicators = () => {
    return [
      { text: 'Unusual payment methods', risk: 'High' },
      { text: 'Pressure tactics in text', risk: 'High' },
      { text: 'Mismatched company details', risk: 'Medium' },
      { text: 'Suspicious bank information', risk: 'High' },
      { text: 'No VAT/tax information', risk: 'Low' },
      { text: 'Generic or missing contact info', risk: 'Medium' }
    ];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Invoice OCR Scanner</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload invoice images or PDFs for text extraction and scam detection analysis.
          Supports JPEG, PNG, and PDF formats.
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            Max file size: 10MB
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            Premium feature
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upload & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="text-center mb-6">
              <div className="h-20 w-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Invoice</h3>
              <p className="text-gray-600">Drag & drop or click to browse files</p>
            </div>

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                uploading
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-blue-600" size={24} />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {previewUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-contain bg-gray-50"
                      />
                      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-2">
                        <Eye size={20} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Click to select or drag and drop
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    JPEG, PNG, PDF up to 10MB
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={clearFile}
                disabled={!selectedFile || uploading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Analyze Invoice</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Extracted Text */}
          {extractedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <FileText className="text-blue-600" />
                  <span>Extracted Text</span>
                </h3>
                <button
                  onClick={downloadResult}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Download size={20} />
                  <span>Download Result</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
                  {extractedText}
                </pre>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Results & Info */}
        <div className="space-y-6">
          {/* Current Result */}
          {result ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">Analysis Result</h3>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Scan ID: {result.scanId?.slice(-8)}
                </div>
              </div>

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
                  <h4 className="font-medium text-gray-700 mb-2">Confidence</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${result.result.confidence}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {result.result.confidence}%
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Key Findings</h4>
                  <p className="text-gray-600 text-sm">
                    {result.result.explanation}
                  </p>
                </div>

                {result.result.detectedIssues && result.result.detectedIssues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Detected Issues</h4>
                    <div className="space-y-2">
                      {result.result.detectedIssues.slice(0, 3).map((issue, index) => (
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
              <h3 className="text-xl font-bold mb-6">Invoice Scam Indicators</h3>
              <div className="space-y-4">
                {getInvoiceIndicators().map((indicator, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${
                      indicator.risk === 'High' ? 'text-red-500' :
                      indicator.risk === 'Medium' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium">{indicator.text}</p>
                      <p className="text-xs text-gray-500">Risk: {indicator.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-purple-50 to-blue-50"
          >
            <h3 className="text-xl font-bold mb-4">OCR Access</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Current Plan</span>
                <span className="font-bold capitalize">{user?.subscription || 'free'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">OCR Feature</span>
                {['premium', 'enterprise'].includes(user?.subscription) ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    Premium Only
                  </span>
                )}
              </div>

              <div className="pt-4">
                {!['premium', 'enterprise'].includes(user?.subscription) ? (
                  <a
                    href="/subscription"
                    className="block text-center btn-primary"
                  >
                    Upgrade for OCR Access
                  </a>
                ) : (
                  <div className="text-center text-sm text-gray-600">
                    <CheckCircle className="inline text-green-500 mr-2" size={16} />
                    You have access to OCR features
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Usage Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-xl font-bold mb-4">Usage Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Scans Remaining</span>
                <span className="font-bold">{user?.scansLeft || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Scans Used</span>
                <span className="font-bold">
                  {subscription?.features?.maxScans 
                    ? subscription.features.maxScans - (user?.scansLeft || 0)
                    : 0}
                </span>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2 btn-secondary"
                >
                  <RefreshCw size={16} />
                  <span>Refresh Stats</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOCR;