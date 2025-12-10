const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const logger = require('../utils/logger');
const { registerSchema, loginSchema } = require('../utils/validators');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    // Validate input
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Create subscription record
    const subscription = new Subscription({
      userId: user._id,
      plan: 'free',
      status: 'active',
      features: {
        maxScans: 10,
        ocrEnabled: false,
        apiAccess: false,
        prioritySupport: false
      }
    });

    await subscription.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
        subscription: subscription
      }
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

exports.login = async (req, res) => {
  try {
    // Validate input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get subscription
    const subscription = await Subscription.findOne({ userId: user._id });

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
        subscription: subscription || null
      }
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const subscription = await Subscription.findOne({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        subscription
      }
    });

  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};