// src/pages/ResetPassword.jsx
import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const pwChecks = useMemo(() => {
    return {
      length: newPassword.length >= 6,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      matches: newPassword === confirm && newPassword.length > 0,
    };
  }, [newPassword, confirm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Invalid or expired reset link.');
      return;
    }
    if (!pwChecks.length || !pwChecks.uppercase || !pwChecks.lowercase || !pwChecks.number) {
      setError('Password does not meet requirements.');
      return;
    }
    if (!pwChecks.matches) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        email,
        newPassword
      });

      if (res.data?.success) {
        // store token if returned (auto-login)
        const returnedToken = res.data.data?.token;
        if (returnedToken) {
          try { localStorage.setItem('token', returnedToken); } catch {}
          // set default header so frontend has token for next requests
          api.defaults.headers.common['Authorization'] = `Bearer ${returnedToken}`;
        }
        setStatus('success');
        // small delay to show message, then redirect
        setTimeout(() => navigate('/dashboard'), 1400);
      } else {
        setError(res.data?.error || 'Reset failed. Try again.');
        setStatus('error');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Server error.');
      setStatus('error');
    }
  };

  if (!token || !email) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-semibold mb-3">Invalid reset link</h2>
        <p className="text-gray-700">The password reset link is missing or invalid.</p>
        <div className="mt-4">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-semibold mb-3">Password updated</h2>
        <p className="text-gray-700">Your password has been updated. Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Reset password</h2>

      <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        className="input-field w-full mb-3"
        placeholder="Enter new password"
        autoComplete="new-password"
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        className="input-field w-full mb-3"
        placeholder="Confirm new password"
        autoComplete="new-password"
      />

      <div className="mb-3 text-sm space-y-1">
        <div className={pwChecks.length ? 'text-green-600' : 'text-gray-500'}>• At least 6 characters</div>
        <div className={pwChecks.uppercase ? 'text-green-600' : 'text-gray-500'}>• One uppercase letter</div>
        <div className={pwChecks.lowercase ? 'text-green-600' : 'text-gray-500'}>• One lowercase letter</div>
        <div className={pwChecks.number ? 'text-green-600' : 'text-gray-500'}>• One number</div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Resetting…' : 'Reset password'}
      </button>

      {status === 'error' && <div className="text-red-600 mt-3">{error}</div>}

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
      </div>
    </form>
  );
}
