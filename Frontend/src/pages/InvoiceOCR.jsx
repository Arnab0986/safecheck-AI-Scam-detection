import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Image,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Tesseract from 'tesseract.js'
import ScoreMeter from '../components/ScoreMeter'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const InvoiceOCR = () => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [zoom, setZoom] = useState(1)

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setExtractedText('')
    setScanResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  const extractWithOCR = async () => {
    if (!file) {
      toast.error('Please select an image first')
      return
    }

    setLoading(true)
    setOcrProgress(0)

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(m.progress)
            }
          }
        }
      )

      setExtractedText(result.data.text)
      toast.success('Text extracted successfully')
    } catch (error) {
      toast.error('Failed to extract text from image')
    } finally {
      setLoading(false)
    }
  }

  const scanInvoice = async () => {
    if (!extractedText.trim()) {
      toast.error('No text to analyze')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/scan/text', {
        text: extractedText,
        type: 'invoice'
      })
      setScanResult(response.data.data.scan)
      toast.success('Invoice analysis complete')
    } catch (error) {
      toast.error('Failed to analyze invoice')
    } finally {
      setLoading(false)
    }
  }

  const clearAll = () => {
    setFile(null)
    setPreview(null)
    setExtractedText('')
    setScanResult(null)
    setZoom(1)
    if (preview) {
      URL.revokeObjectURL(preview)
    }
  }

  const commonInvoiceScams = [
    'Overdue payment threats',
    'Fake company details',
    'Incorrect payment details',
    'Urgent payment demands',
    'Suspicious bank accounts',
    'Duplicate invoices',
    'Inflated amounts'
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Invoice OCR Scanner
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Upload invoice images to extract text and detect fraud
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Preview */}
        <div className="space-y-8">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upload Invoice
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload an image of your invoice
                </p>
              </div>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence>
                {file ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    <div className="relative mx-auto max-w-xs">
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-48 object-contain"
                          style={{ transform: `scale(${zoom})` }}
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setZoom(prev => Math.max(0.5, prev - 0.25))
                          }}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setZoom(prev => Math.min(3, prev + 0.25))
                          }}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop invoice image'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        or click to browse (PNG, JPG, WebP up to 5MB)
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={clearAll}
                disabled={!file}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </button>
              <button
                onClick={extractWithOCR}
                disabled={!file || loading}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Extract Text</span>
                  </>
                )}
              </button>
            </div>

            {/* OCR Progress */}
            {loading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Processing image...
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(ocrProgress * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${ocrProgress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Extracted Text */}
          {extractedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Extracted Text
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {extractedText.length} characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {extractedText}
                </pre>
              </div>

              <div className="mt-6">
                <button
                  onClick={scanInvoice}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Scan for Invoice Fraud</span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Results & Info */}
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
                    {scanResult.result.isScam ? '⚠️ Fraud Detected' : '✅ Likely Legitimate'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {scanResult.result.explanation}
                  </p>
                </div>

                {/* Indicators */}
                {scanResult.result.indicators && scanResult.result.indicators.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Red Flags Found
                    </h4>
                    <div className="space-y-2">
                      {scanResult.result.indicators.slice(0, 5).map((indicator, index) => (
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
                {scanResult.result.recommendations && scanResult.result.recommendations.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {scanResult.result.recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {recommendation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(scanResult.result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {scanResult.result.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
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
                  <AlertTriangle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Analysis Results
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload an invoice and extract text to see analysis results
                </p>
              </div>
            </motion.div>
          )}

          {/* Common Scams Card */}
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
                  Common Invoice Scams
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Warning signs to watch for
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {commonInvoiceScams.map((scam, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {scam}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">💡 <strong>Tips:</strong></p>
                <ul className="space-y-1">
                  <li>• Verify sender's contact information</li>
                  <li>• Check invoice numbers against records</li>
                  <li>• Contact the company directly if unsure</li>
                  <li>• Never pay to suspicious bank accounts</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceOCR