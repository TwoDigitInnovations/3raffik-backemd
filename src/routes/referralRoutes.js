const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/link', authMiddleware(), referralController.getReferralLink);
router.get('/companies', authMiddleware(), referralController.getReferredCompanies);
router.get('/earnings', authMiddleware(), referralController.getReferralEarnings);
router.get('/stats', authMiddleware(), referralController.getReferralStats);

module.exports = router;
