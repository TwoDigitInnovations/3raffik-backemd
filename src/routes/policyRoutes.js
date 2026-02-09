const express = require('express');
const router = express.Router();
const { getPolicy, updatePolicy, getAllPolicies } = require('@controllers/policyController');
const auth = require('@middlewares/authMiddleware');

// Public routes
router.get('/:type', getPolicy);

// Admin only routes
router.put('/:type', auth('admin'), updatePolicy);
router.get('/', auth('admin'), getAllPolicies);

module.exports = router;
