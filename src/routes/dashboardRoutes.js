const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('@controllers/dashboardController');
const auth = require('@middlewares/authMiddleware');

router.get('/stats', auth('admin'), getDashboardStats);

module.exports = router;