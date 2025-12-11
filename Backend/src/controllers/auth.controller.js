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
 * FORGOT PASSWORD
 * ============================
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Do NOT reveal user existence
      return res.json({
        success: true,
        message: "If the email exists, reset instructions were sent.",
      });
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
    await user.save();

    await emailService.sendResetEmail(email, rawToken);

    return res.json({
      success: true,
      message: "If the email exists, reset instructions were sent.",
    });
  } catch (err) {
    logger.error("Forgot password error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to send reset email" });
  }
};

/**
 * ============================
 * RESET PASSWORD
 * ============================
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword)
      return res
        .status(400)
        .json({ success: false, error: "Missing fields" });

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
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired token" });

    user.password = newPassword; // pre-save will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Auto login
    const authToken = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return res.json({
      success: true,
      data: { token: authToken, user: userData },
    });
  } catch (err) {
    logger.error("Reset password error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to reset password" });
  }
};
