const express = require('express');
const router = express.Router();
const { getNotification,getnotificationforapp } = require('@controllers/notificationController');
const auth = require('@middlewares/authMiddleware');

router.get('/getNotification', auth('admin', 'org'), getNotification);
router.get('/getnotificationforapp', auth('user', 'guard', 'org', 'tech'), getnotificationforapp);

module.exports = router;