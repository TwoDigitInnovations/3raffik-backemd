const express = require('express');
const router = express.Router();
const { getNotification, getnotificationforapp, sendConnectionRequest, updateNotificationStatus } = require('@controllers/notificationController');
const auth = require('@middlewares/authMiddleware');

router.post('/sendConnectionRequest', auth('company', 'user'), sendConnectionRequest);
router.get('/getNotification', auth('admin', 'org'), getNotification);
router.get('/getnotificationforapp', auth('user', 'company'), getnotificationforapp);
router.post('/updateStatus', auth('user', 'company'), updateNotificationStatus);

module.exports = router;