const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Subscription = require("../models/Subscription.model");
const logger = require("../utils/logger");
const emailService = require("../services/email.service");

// Generate auth token
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * ============================
 * REGISTER
 * ============================
 */
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        error: "Email & password required",
      });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, error: "User exists" });

    const user = new User({ email, password, name });
    await user.save();

    const subscription = await Subscription.create({
      userId: user._id,
      plan: "free",
      status: "active",
      features: {
        maxScans: 10,
        ocrEnabled: false,
        apiAccess: false,
        prioritySupport: false,
      },
    });

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      data: { user: userData, token, subscription },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Register failed" });
  }
};

/**
 * ============================
 * LOGIN
 * ============================
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });

    const match = await user.comparePassword(password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });

    const subscription = await Subscription.findOne({ userId: user._id });

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      data: { user: userData, token, subscription },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Login failed" });
  }
};

/**
 * ============================
 * GET PROFILE
 * ============================
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const subscription = await Subscription.findOne({ userId: req.user._id });

    return res.json({
      success: true,
      data: { user, subscription },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Profile error" });
  }
};

/**
 * ============================
 * UPDATE PROFILE
 * ============================
 */
const updateProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name: req.body.name },
      { new: true }
    ).select("-password");

    return res.json({ success: true, data: { user: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Update failed" });
  }
};

/**
 * ============================
 * FORGOT PASSWORD
 * ============================
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({
        success: false,
        error: "Email required",
      });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({
        success: true,
        message: "If email exists, reset link sent",
      });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await emailService.sendResetEmail(email, rawToken);

    return res.json({
      success: true,
      message: "If email exists, reset link sent",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Could not send reset email" });
  }
};

/**
 * ============================
 * RESET PASSWORD
 * ============================
 */
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token",
      });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const authToken = generateToken(user._id);

    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      data: { token: authToken, user: userData },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Reset failed" });
  }
};

/**
 * ============================
 * EXPORT ALL CONTROLLERS
 * ============================
 */
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};
