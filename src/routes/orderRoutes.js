const express = require('express');
const router = express.Router();
const auth = require('@middlewares/authMiddleware');
const {
    createOrder,
    getOrderById,
    getOrderByOrderId,
    updateOrderStatus,
    getAffiliateCommissions,
    getCompanyOrders,
    getAffiliateCommissionedProducts
} = require('@controllers/orderController');

// Public routes
router.post('/create', createOrder);
router.get('/track/:orderId', getOrderByOrderId);

// Protected routes
router.get('/affiliate/commissions', auth('user'), getAffiliateCommissions);
router.get('/affiliate/commissioned-products', auth('user'), getAffiliateCommissionedProducts);
router.get('/company/orders', auth('company'), getCompanyOrders);
router.get('/:id', auth('admin', 'user', 'company'), getOrderById);
router.put('/:id/status', auth('admin', 'company'), updateOrderStatus);

module.exports = router;