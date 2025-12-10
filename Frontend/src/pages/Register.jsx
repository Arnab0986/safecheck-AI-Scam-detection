// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pw) => ({
    length: pw.length >= 6,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  });

  const passwordRequirements = validatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!Object.values(passwordRequirements).every(Boolean)) {
      setError('Password does not meet requirements.');
      return;
    }

    setLoading(true);
    try {
      // call register and prevent its internal redirect so we control navigation
      const result = await register({ name, email, password }, { redirect: false });

      if (!result.success) {
        setError(result.error || 'Registration failed. Try again.');
        setLoading(false);
        return;
      }

      // success -> navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="SafeCheck" className="h-16 w-16" />
          </div>
          <h2 className="text-3xl font-bold">Create Your Account</h2>
          <p className="mt-2 text-gray-600">Join SafeCheck and start protecting yourself from scams</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6" noValidate>
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                aria-describedby="password-requirements"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>

            {/* Password Requirements */}
            <div id="password-requirements" className="mt-3 space-y-2 text-sm">
              <Requirement label="At least 6 characters" ok={passwordRequirements.length} />
              <Requirement label="One uppercase letter" ok={passwordRequirements.uppercase} />
              <Requirement label="One lowercase letter" ok={passwordRequirements.lowercase} />
              <Requirement label="One number" ok={passwordRequirements.number} />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input-field pl-10 ${password && confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-center">
            <input id="terms" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" required />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="#" className="text-blue-600 hover:text-blue-500">Terms of Service</Link>{' '}
              and{' '}
              <Link to="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Shield size={20} />
                <span>Create Account</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">Sign in</Link>
            </p>
          </div>
        </form>

        {/* Benefits */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">What you get with SafeCheck:</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>10 free scam detection scans</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Real-time analysis and alerts</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Secure and private processing</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required to start</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function Requirement({ label, ok }) {
  return (
    <div className="flex items-center space-x-2">
      <CheckCircle className={`h-4 w-4 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
      <span className={`text-sm ${ok ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

export default Register;
