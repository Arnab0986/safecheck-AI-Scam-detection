import React from 'react';
import { Shield, Github, Twitter, Mail, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="SafeCheck" className="h-12 w-12" />
              <div>
                <h2 className="text-2xl font-bold">SafeCheck</h2>
                <p className="text-gray-400">AI Scam Detection</p>
              </div>
            </div>
            <p className="text-gray-400">
              Protecting users from scams and fraudulent activities using advanced AI technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/job-checker" className="text-gray-400 hover:text-white transition-colors">Job Checker</a></li>
              <li><a href="/invoice-ocr" className="text-gray-400 hover:text-white transition-colors">Invoice OCR</a></li>
              <li><a href="/subscription" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400">
                <Shield size={16} />
                <span>Text Scam Detection</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Shield size={16} />
                <span>URL Safety Check</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Shield size={16} />
                <span>Job Offer Verification</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Shield size={16} />
                <span>Invoice OCR Analysis</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail size={20} className="text-gray-400" />
                <span className="text-gray-400">support@safcheck.com</span>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter size={24} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            Made with <Heart size={16} className="inline text-red-500" /> by SafeCheck Team • © {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Terms of Service • Privacy Policy • GDPR Compliance
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;