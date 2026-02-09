const express = require('express');
const router = express.Router();
const adminController = require('@controllers/adminController');
const authMiddleware = require('@middlewares/authMiddleware');

// Dashboard stats
router.get('/dashboard/stats', authMiddleware('admin'), adminController.getDashboardStats);

// Wallet and Commission routes
router.get('/wallet/stats', authMiddleware('admin'), adminController.getWalletStats);
router.get('/commission/settings', authMiddleware('admin'), adminController.getCommissionSettings);
router.post('/commission/update', authMiddleware('admin'), adminController.updateCommissionSettings);

// Company routes
router.get('/companies', authMiddleware('admin'), adminController.getAllCompanies);
router.get('/companies/:id', authMiddleware('admin'), adminController.getCompanyById);
router.put('/companies/:id/status', authMiddleware('admin'), adminController.updateCompanyStatus);
router.delete('/companies/:id', authMiddleware('admin'), adminController.deleteCompany);

// Campaign routes
router.get('/campaigns', authMiddleware('admin'), adminController.getAllCampaigns);
router.get('/campaigns/:id', authMiddleware('admin'), adminController.getCampaignById);
router.put('/campaigns/:id/status', authMiddleware('admin'), adminController.updateCampaignStatus);

// Affiliate routes
router.get('/affiliates', authMiddleware('admin'), adminController.getAllAffiliates);
router.get('/affiliates/:id', authMiddleware('admin'), adminController.getAffiliateById);
router.put('/affiliates/:id/status', authMiddleware('admin'), adminController.updateAffiliateStatus);

// Product routes
router.get('/products', authMiddleware('admin'), adminController.getAllProducts);
router.get('/products/:id', authMiddleware('admin'), adminController.getProductById);
router.put('/products/:id/status', authMiddleware('admin'), adminController.updateProductStatus);

// Order routes
const orderController = require('@controllers/orderController');
router.get('/orders', authMiddleware('admin'), orderController.getAllOrders);
router.get('/orders/:id', authMiddleware('admin'), orderController.getOrderById);

module.exports = router;
