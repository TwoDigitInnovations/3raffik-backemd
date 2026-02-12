const express = require('express');
const router = express.Router();
const { getDashboardStats, getCompanyDashboard, getAffiliateDashboard } = require('@controllers/dashboardController');
const auth = require('@middlewares/authMiddleware');

router.get('/stats', auth('admin'), getDashboardStats);
router.get('/company', auth('company'), getCompanyDashboard);
router.get('/affiliate', auth('user'), getAffiliateDashboard);

module.exports = router;