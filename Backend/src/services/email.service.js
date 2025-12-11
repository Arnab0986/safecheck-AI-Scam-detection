const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true", // false = TLS auto
  auth: {
    user: process.env.EMAIL_USER,    // safecheck.notifications@gmail.com
    pass: process.env.EMAIL_PASS,    // Gmail 16-char app password
  },
});

/**
 * Generic email sender
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    logger.info(`📨 Email sent: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    logger.error(`❌ Email sending error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Password Reset Email
 */
exports.sendResetEmail = async (email, rawToken) => {
  const frontend = (process.env.FRONTEND_BASE_URL || "").replace(/\/$/, "");
  const resetUrl = `${frontend}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Reset Your SafeCheck Password</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" 
         style="display:inline-block;padding:10px 18px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
         Reset Password
      </a>
      <p>If the button doesn’t work, open this link:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link is valid for <strong>1 hour</strong>.</p>
    </div>
  `;

  return exports.sendEmail({
    to: email,
    subject: "SafeCheck – Password Reset Request",
    html,
  });
};
