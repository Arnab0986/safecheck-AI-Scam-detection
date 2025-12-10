// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('sending');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('sent');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send reset email.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-semibold mb-3">Check your email</h2>
        <p className="text-gray-700">
          If an account exists for <strong>{email}</strong>, we sent password reset instructions. The link is valid for one hour.
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Forgot password</h2>

      <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input
        id="fp-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
        required
        className="input-field w-full mb-3"
        placeholder="you@example.com"
        autoComplete="email"
      />

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending…' : 'Send reset link'}
      </button>

      {status === 'error' && <div className="text-red-600 mt-3">{error}</div>}

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
      </div>
    </form>
  );
}
