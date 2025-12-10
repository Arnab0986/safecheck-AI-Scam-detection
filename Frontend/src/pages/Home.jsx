import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, FileText, Globe, Zap, CheckCircle, Users, Lock } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Search className="text-blue-600" size={32} />,
      title: 'Text Analysis',
      description: 'Detect scams in messages, emails, and social media posts using AI-powered analysis.'
    },
    {
      icon: <Globe className="text-green-600" size={32} />,
      title: 'URL Safety Check',
      description: 'Verify website URLs for phishing attempts and malicious content in real-time.'
    },
    {
      icon: <FileText className="text-purple-600" size={32} />,
      title: 'Job Offer Verification',
      description: 'Analyze job postings to identify fraudulent offers and employment scams.'
    },
    {
      icon: <Shield className="text-red-600" size={32} />,
      title: 'Invoice OCR',
      description: 'Upload invoice images for text extraction and scam detection analysis.'
    }
  ];

  const stats = [
    { value: '99%', label: 'Accuracy Rate', icon: <CheckCircle size={24} /> },
    { value: '50K+', label: 'Scans Processed', icon: <Zap size={24} /> },
    { value: '10K+', label: 'Users Protected', icon: <Users size={24} /> },
    { value: '24/7', label: 'Real-time Protection', icon: <Lock size={24} /> }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">AI-Powered</span> Scam Detection
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Protect yourself from online scams, phishing attempts, and fraudulent activities with our advanced AI detection system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Hero Image/Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full" />
          <div className="relative glass-effect max-w-4xl mx-auto rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Search className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Instant Analysis</h3>
                    <p className="text-gray-600 text-sm">Get results in seconds</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multiple Formats</h3>
                    <p className="text-gray-600 text-sm">Text, URLs, images, and more</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Zap className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Protection</h3>
                    <p className="text-gray-600 text-sm">Continuous monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Lock className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Secure & Private</h3>
                    <p className="text-gray-600 text-sm">Your data is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive scam detection across multiple formats with AI-powered analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-3xl"
            >
              <div className="h-16 w-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center text-white"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 bg-white/20 rounded-full mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-100">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Start Protecting Yourself Today</h2>
          <p className="text-gray-600 mb-10">
            Join thousands of users who trust SafeCheck for their online safety.
            Get 10 free scans when you sign up.
          </p>
          
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              Continue to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;