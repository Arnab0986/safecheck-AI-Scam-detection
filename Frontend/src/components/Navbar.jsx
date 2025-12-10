// src/components/Navbar.jsx
import React, { useState, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LogOut, Search, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ item, onClick }) => (
  <NavLink
    to={item.path}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
        isActive ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
      }`
    }
    role="menuitem"
  >
    {item.icon}
    <span>{item.label}</span>
  </NavLink>
);

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    // ensure we end up on login/home after logout
    navigate('/login');
  };

  /** Memoized nav items */
  const navItems = useMemo(
    () => [
      { label: 'Home', path: '/', icon: <Shield size={18} /> },
      ...(isAuthenticated
        ? [
            { label: 'Dashboard', path: '/dashboard', icon: <Search size={18} /> },
            { label: 'Job Checker', path: '/job-checker', icon: <FileText size={18} /> },
            { label: 'Invoice OCR', path: '/invoice-ocr', icon: <FileText size={18} /> },
            { label: 'Subscription', path: '/subscription', icon: <Shield size={18} /> },
          ]
        : []),
    ],
    [isAuthenticated]
  );

  const userLabel = user?.name || user?.email?.split?.('@')?.[0] || 'User';

  return (
    <nav className="glass-effect sticky top-0 z-50" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="SafeCheck logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">SafeCheck</h1>
              <p className="text-sm text-gray-600">AI Scam Detection</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavItem key={item.label} item={item} onClick={() => setIsMenuOpen(false)} />
            ))}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* User summary */}
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="font-medium">{userLabel}</span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-6 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setIsMenuOpen((s) => !s)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden mt-4 py-4 border-t border-gray-200 transform transition-all ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible -translate-y-2'
          }`}
          role="menu"
        >
          <div className="space-y-3">
            {navItems.map((item) => (
              <NavItem key={item.label} item={item} onClick={() => setIsMenuOpen(false)} />
            ))}

            {isAuthenticated ? (
              <>
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{userLabel}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-3 px-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-blue-600 hover:bg-blue-50 font-medium rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
