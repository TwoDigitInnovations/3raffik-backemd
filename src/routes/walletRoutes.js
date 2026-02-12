const express = require('express');
const router = express.Router();
const { getAffiliateWallet, getCompanyWallet, requestWithdrawal, getWithdrawalHistory, getAllWithdrawals, updateWithdrawalStatus } = require('@controllers/walletController');
const auth = require('@middlewares/authMiddleware');

router.get('/affiliate', auth('user'), getAffiliateWallet);
router.get('/company', auth('company'), getCompanyWallet);
router.post('/withdraw', auth('user', 'company'), requestWithdrawal);
router.get('/withdrawals', auth('user', 'company'), getWithdrawalHistory);

// Admin routes
router.get('/admin/withdrawals', auth('admin'), getAllWithdrawals);
router.put('/admin/withdrawals/:withdrawalId', auth('admin'), updateWithdrawalStatus);

module.exports = router;
