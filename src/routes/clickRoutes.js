const express = require('express');
const router = express.Router();
const { trackClick, getAffiliateClickStats } = require('@controllers/clickController');
const auth = require('@middlewares/authMiddleware');

router.post('/track', trackClick);
router.get('/stats', auth('user'), getAffiliateClickStats);

module.exports = router;
