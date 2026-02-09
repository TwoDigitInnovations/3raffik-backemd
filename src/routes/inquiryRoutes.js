const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const {
  submitInquiry,
  getAllInquiries,
  getMyInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
} = require('@controllers/inquiryController');

// Public route - anyone can submit inquiry
router.post('/submit', submitInquiry);

// Authenticated routes
router.get('/my-inquiries', auth('admin', 'user', 'company'), getMyInquiries);
router.get('/:id', auth('admin', 'user', 'company'), getInquiryById);

// Admin only routes
router.get('/', auth('admin'), getAllInquiries);
router.put('/:id', auth('admin'), updateInquiry);
router.delete('/:id', auth('admin'), deleteInquiry);

module.exports = router;
