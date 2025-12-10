// controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const logger = require('../utils/logger');
const { registerSchema, loginSchema } = require('../utils/validators');

// --- Token generator
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- Nodemailer transporter (configure via env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true', // true if 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --------------------
// REGISTER
// --------------------
exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const user = new User({ email, password, name });
    await user.save();

    const subscription = new Subscription({
      userId: user._id,
      plan: 'free',
      status: 'active',
      features: {
        maxScans: 10,
        ocrEnabled: false,
        apiAccess: false,
        prioritySupport: false,
      },
    });
    await subscription.save();

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`New user registered: ${user.email}`);

    return res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
        subscription,
      },
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

// --------------------
// LOGIN
// --------------------
exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const subscription = await Subscription.findOne({ userId: user._id });
    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
        subscription: subscription || null,
      },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// --------------------
// GET PROFILE
// --------------------
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const subscription = await Subscription.findOne({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      data: {
        user,
        subscription,
      },
    });
  } catch (err) {
    logger.error(`Get profile error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

// --------------------
// UPDATE PROFILE
// --------------------
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// --------------------
// FORGOT PASSWORD
// --------------------
// POST /auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal that the email does not exist
      return res.status(200).json({ success: true, message: 'If that email exists, reset instructions were sent.' });
    }

    // Generate raw token and store hashed version
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Build reset URL (frontend route)
    const frontendBase = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset your SafeCheck password',
      html: `
        <p>We got a request to reset your SafeCheck password. Click the link below to reset (valid 1 hour):</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'If that email exists, reset instructions were sent.' });
  } catch (err) {
    logger.error(`forgotPassword error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to process request' });
  }
};

// --------------------
// RESET PASSWORD
// --------------------
// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    user.password = newPassword; // User pre-save hook should hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Optionally log the user in immediately by issuing a JWT
    const authToken = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({ success: true, data: { token: authToken, user: userObj } });
  } catch (err) {
    logger.error(`resetPassword error: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};
