const express = require('express');
const router = express.Router();
const { adminLogin, adminVerifyOTP, adminResendOTP } = require('@controllers/adminAuthController');

// Admin 2FA Login — Step 1: credentials → sends OTP
router.post('/login', adminLogin);

// Admin 2FA Login — Step 2: verify OTP → returns JWT
router.post('/verify-otp', adminVerifyOTP);

// Resend OTP
router.post('/resend-otp', adminResendOTP);

module.exports = router;
