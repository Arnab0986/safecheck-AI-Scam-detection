import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ScanCard from '../components/ScanCard';
import ScoreMeter from '../components/ScoreMeter';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Link as LinkIcon, 
  FileText, 
  Image as ImageIcon,
  Shield, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user, subscription } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    safeScans: 0,
    suspiciousScans: 0,
    dangerousScans: 0,
    recentScans: []
  });
  const [activeTab, setActiveTab] = useState('all');
  const [scanText, setScanText] = useState('');

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scan/history?limit=10');
      setScans(response.data.data.scans);
      
      // Calculate stats
      const total = response.data.data.scans.length;
      const safe = response.data.data.scans.filter(s => s.result.level === 'safe').length;
      const suspicious = response.data.data.scans.filter(s => s.result.level === 'suspicious').length;
      const dangerous = response.data.data.scans.filter(s => s.result.level === 'dangerous').length;
      
      setStats({
        totalScans: total,
        safeScans: safe,
        suspiciousScans: suspicious,
        dangerousScans: dangerous,
        recentScans: response.data.data.scans.slice(0, 3)
      });
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const handleTextScan = async () => {
    if (!scanText.trim()) {
      toast.error('Please enter text to scan');
      return;
    }

    try {
      toast.loading('Analyzing text for scams...');
      const response = await api.post('/scan/text', { text: scanText });
      toast.dismiss();
      toast.success('Scan completed successfully!');
      
      // Refresh scan history
      fetchScanHistory();
      setScanText('');
    } catch (error) {
      toast.dismiss();
      const message = error.response?.data?.error || 'Scan failed';
      toast.error(message);
    }
  };

  const handleScanClick = (scan) => {
    // Show scan details modal
    toast.success(`Viewing scan: ${scan._id}`);
  };

  const filteredScans = scans.filter(scan => {
    if (activeTab === 'all') return true;
    return scan.result.level === activeTab;
  });

  const getScanTypeIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={20} className="text-blue-600" />;
      case 'url': return <LinkIcon size={20} className="text-green-600" />;
      case 'job': return <FileText size={20} className="text-purple-600" />;
      case 'invoice': return <ImageIcon size={20} className="text-red-600" />;
      default: return <Search size={20} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">
            Here's your scam detection dashboard and activity overview.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <span className="text-sm text-gray-600">Scans left:</span>
            <span className="ml-2 font-bold text-lg">{user?.scansLeft || 0}</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow border">
            <span className="text-sm text-gray-600">Plan:</span>
            <span className="ml-2 font-bold capitalize">{user?.subscription || 'free'}</span>
          </div>
        </div>
      </div>

      {/* Quick Scan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search className="text-blue-600" />
              Quick Text Scan
            </h2>
            <p className="text-gray-600">Paste suspicious text below for instant analysis</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock size={16} />
            <span>Instant results</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <textarea
            value={scanText}
            onChange={(e) => setScanText(e.target.value)}
            placeholder="Paste suspicious text, email, or message here..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {scanText.length}/5000 characters
            </div>
            <button
              onClick={handleTextScan}
              disabled={!scanText.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={20} className="mr-2" />
              Scan Text
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-blue-600" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.totalScans}</div>
          <div className="text-gray-600">Total Scans</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-green-600" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.safeScans}</div>
          <div className="text-gray-600">Safe</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.suspiciousScans}</div>
          <div className="text-gray-600">Suspicious</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card text-center"
        >
          <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.dangerousScans}</div>
          <div className="text-gray-600">Dangerous</div>
        </motion.div>
      </div>

      {/* Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scan History */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Scans</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchScanHistory}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <div className="flex space-x-2">
                {['all', 'safe', 'suspicious', 'dangerous'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Loading scans...</p>
              </div>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="card text-center py-12">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scans found</h3>
              <p className="text-gray-600 mb-6">Start by scanning some text or URLs</p>
              <button
                onClick={() => setScanText('Example: You won a free iPhone! Click here to claim.')}
                className="btn-secondary"
              >
                Try Example Scan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredScans.map((scan) => (
                <ScanCard
                  key={scan._id}
                  scan={scan}
                  onClick={() => handleScanClick(scan)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Risk Overview */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-6">Risk Overview</h3>
            <div className="flex justify-center mb-8">
              <ScoreMeter 
                score={stats.totalScans > 0 ? 
                  Math.round((stats.dangerousScans * 100 + stats.suspiciousScans * 50) / stats.totalScans) 
                  : 0
                }
                size={200}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Overall Risk Score</span>
                <span className="font-bold">Medium</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Detection Accuracy</span>
                <span className="font-bold">95%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/job-checker'}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="text-blue-600" />
                  <span>Check Job Offer</span>
                </div>
                <TrendingUp size={16} className="text-gray-400" />
              </button>
              
              <button
                onClick={() => window.location.href = '/invoice-ocr'}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ImageIcon className="text-purple-600" />
                  <span>Scan Invoice</span>
                </div>
                <TrendingUp size={16} className="text-gray-400" />
              </button>
              
              <button
                onClick={() => window.location.href = '/subscription'}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="text-green-600" />
                  <span>Upgrade Plan</span>
                </div>
                <TrendingUp size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;