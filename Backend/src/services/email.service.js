// src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

/**
 * ======================================================
 * EMAIL TRANSPORTER (Gmail SMTP + App Password)
 * ======================================================
 *
 * Gmail requires:
 *   EMAIL_USER = safecheck.notifications@gmail.com
 *   EMAIL_PASS = 16-character app password (NOT your login password)
 *
 * App password example: "abcd efgh ijkl mnop"
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true", // false for port 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // 16-char Gmail app password
  },
});

/**
 * ======================================================
 * GENERIC EMAIL SENDER
 * ======================================================
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    logger.info(`📨 Email sent successfully: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    logger.error(`❌ Email sending failed: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * ======================================================
 * SEND PASSWORD RESET EMAIL
 * ======================================================
 */
exports.sendResetEmail = async (email, rawToken) => {
  const frontendUrl = (process.env.FRONTEND_BASE_URL || "").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color:#222;">
      <h2 style="color:#2563eb;">Reset Your SafeCheck Password</h2>

      <p>You requested to reset your SafeCheck account password.</p>

      <p>Click the button below to continue:</p>

      <a href="${resetUrl}"
         style="display:inline-block; margin-top:10px; padding:12px 20px; background:#2563eb; color:white;
                text-decoration:none; border-radius:6px; font-weight:bold;">
        Reset Password
      </a>

      <p style="margin-top:20px;">If the button doesn't work, here is the full link:</p>
      <p><a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a></p>

      <p style="margin-top:20px;">This link is valid for <strong>1 hour</strong>.</p>

      <p>If you didn't request this, you can safely ignore this email.</p>

      <hr style="margin:30px 0; border:0; border-top:1px solid #ddd;" />

      <p style="font-size:12px; color:#666;">SafeCheck Security System</p>
    </div>
  `;

  return exports.sendEmail({
    to: email,
    subject: "SafeCheck – Password Reset Instructions",
    html,
  });
};
