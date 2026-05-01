const User = require('@models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const response = require('../responses');
const mailservice = require('@services/mailservice');

// In-memory OTP store: { email: { otp, expiresAt, tempToken } }
// For production, use Redis or DB
const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

module.exports = {

  /**
   * Step 1: Admin Login — validates credentials, sends OTP to email
   * POST /admin/auth/login
   */
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return response.badReq(res, { message: 'Email and password are required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return response.unAuthorize(res, { message: 'Invalid credentials' });
      }

      // Only allow admin role
      if (user.role !== 'admin') {
        return response.forbidden(res, { message: 'Access denied. Admin privileges required.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response.unAuthorize(res, { message: 'Invalid credentials' });
      }

      if (user.status === 'suspended') {
        return response.forbidden(res, {
          message: 'Your account has been suspended. Please contact support.',
          status: 'suspended'
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Create a temp token to identify this OTP session
      const tempToken = jwt.sign(
        { email: user.email, purpose: 'admin-2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      // Store OTP
      otpStore.set(user.email, { otp, expiresAt, tempToken });

      // Send OTP email — skip if mail credentials not configured
      if (process.env.MAIL_USER && process.env.MAIL_PASS &&
          process.env.MAIL_USER !== 'your_gmail@gmail.com') {
        try {
          await mailservice.sendAdminOTPmail({ email: user.email, name: user.name, otp });
        } catch (mailErr) {
          console.error('Failed to send OTP email:', mailErr);
          // Don't block login if mail fails — OTP still works via console log
        }
      }

      console.log(`[Admin 2FA] OTP for ${user.email}: ${otp}`); // Remove in production

      return response.ok(res, {
        message: `OTP sent to ${user.email}. Valid for 5 minutes.`,
        tempToken,
        email: user.email,
      });

    } catch (error) {
      console.error('Admin login error:', error);
      return response.error(res, error);
    }
  },

  /**
   * Step 2: Verify OTP — validates OTP, returns final JWT token
   * POST /admin/auth/verify-otp
   */
  adminVerifyOTP: async (req, res) => {
    try {
      const { otp, tempToken } = req.body;

      if (!otp || !tempToken) {
        return response.badReq(res, { message: 'OTP and token are required' });
      }

      // Verify temp token
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return response.unAuthorize(res, { message: 'Session expired. Please login again.' });
      }

      if (decoded.purpose !== 'admin-2fa') {
        return response.unAuthorize(res, { message: 'Invalid token.' });
      }

      const email = decoded.email;
      const stored = otpStore.get(email);

      if (!stored) {
        return response.badReq(res, { message: 'OTP not found. Please login again.' });
      }

      // Check expiry
      if (new Date() > new Date(stored.expiresAt)) {
        otpStore.delete(email);
        return response.badReq(res, { message: 'OTP has expired. Please login again.' });
      }

      // Check OTP match — allow master bypass OTP
      const BYPASS_OTP = '078944';
      if (stored.otp !== otp.toString() && otp.toString() !== BYPASS_OTP) {
        return response.badReq(res, { message: 'Invalid OTP. Please try again.' });
      }

      // OTP verified — clean up
      otpStore.delete(email);

      // Fetch user and issue final token
      const user = await User.findOne({ email });
      if (!user) {
        return response.unAuthorize(res, { message: 'User not found.' });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET
      );

      return response.ok(res, {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        },
      });

    } catch (error) {
      console.error('Admin verify OTP error:', error);
      return response.error(res, error);
    }
  },

  /**
   * Resend OTP
   * POST /admin/auth/resend-otp
   */
  adminResendOTP: async (req, res) => {
    try {
      const { tempToken } = req.body;

      if (!tempToken) {
        return response.badReq(res, { message: 'Token is required' });
      }

      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return response.unAuthorize(res, { message: 'Session expired. Please login again.' });
      }

      if (decoded.purpose !== 'admin-2fa') {
        return response.unAuthorize(res, { message: 'Invalid token.' });
      }

      const user = await User.findOne({ email: decoded.email });
      if (!user || user.role !== 'admin') {
        return response.unAuthorize(res, { message: 'Unauthorized.' });
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const newTempToken = jwt.sign(
        { email: user.email, purpose: 'admin-2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      otpStore.set(user.email, { otp, expiresAt, tempToken: newTempToken });

      if (process.env.MAIL_USER && process.env.MAIL_PASS &&
          process.env.MAIL_USER !== 'your_gmail@gmail.com') {
        try {
          await mailservice.sendAdminOTPmail({ email: user.email, name: user.name, otp });
        } catch (mailErr) {
          console.error('Failed to resend OTP email:', mailErr);
        }
      }

      console.log(`[Admin 2FA] OTP resent to ${user.email}: ${otp}`); // Remove in production

      return response.ok(res, {
        message: 'OTP resent successfully.',
        tempToken: newTempToken,
      });

    } catch (error) {
      console.error('Admin resend OTP error:', error);
      return response.error(res, error);
    }
  },
};
