const express = require('express');
const router = express.Router();
const Content = require('@controllers/ContentController');
const auth = require('@middlewares/authMiddleware');

router.get('/get', Content.getContent);
router.post('/update', Content.updateContent);

module.exports = router;
