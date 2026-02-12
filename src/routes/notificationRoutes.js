const express = require('express');
const router = express.Router();
const { getNotification, getnotificationforapp, sendConnectionRequest, updateNotificationStatus, checkCampaignConnection } = require('@controllers/notificationController');
const auth = require('@middlewares/authMiddleware');

router.post('/sendConnectionRequest', auth('company', 'user'), sendConnectionRequest);
router.get('/getNotification', auth('admin', 'org'), getNotification);
router.get('/getnotificationforapp', auth('user', 'company'), getnotificationforapp);
router.post('/updateStatus', auth('user', 'company'), updateNotificationStatus);
router.get('/checkConnection/:campaign_id', auth('user'), checkCampaignConnection);

module.exports = router;