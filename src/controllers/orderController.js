const Order = require('@models/Order');
const Product = require('@models/Product');
const Commission = require('@models/Commission');
const AdminCommission = require('@models/AdminCommission');
const User = require('@models/User');
const mongoose = require('mongoose');
const response = require('../responses');

module.exports = {
  createOrder: async (req, res) => {
    try {
      const {
        orderId,
        customer,
        items,
        shippingAddress,
        paymentMethod,
        totalAmount,
        trackingInfo
      } = req.body;

      // Get admin commission settings
      let adminCommissionAmount = 0;
      const adminCommissionSettings = await AdminCommission.findOne({ is_active: true });
      
      if (adminCommissionSettings && adminCommissionSettings.commission_percentage) {
        const commissionPercentage = adminCommissionSettings.commission_percentage;
        adminCommissionAmount = (totalAmount * commissionPercentage) / 100;
      }

    
      let validTrackingInfo = null;
      if (trackingInfo && 
          trackingInfo.affiliateId && 
          trackingInfo.companyId &&
          trackingInfo.affiliateId !== 'affiliate_id' &&
          trackingInfo.companyId !== 'company_id' &&
          mongoose.Types.ObjectId.isValid(trackingInfo.affiliateId) &&
          mongoose.Types.ObjectId.isValid(trackingInfo.companyId)) {
        validTrackingInfo = trackingInfo;
      }

    
      const order = new Order({
        orderId,
        customer,
        items,
        shippingAddress,
        paymentMethod,
        totalAmount,
        admin_commission: adminCommissionAmount,
        trackingInfo: validTrackingInfo,
        status: 'confirmed',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      });

      await order.save();

      
      if (validTrackingInfo) {
        for (const item of items) {
          const product = await Product.findById(item.product);
          if (product && product.affiliate_commission) {
            const commissionRate = parseFloat(product.affiliate_commission);
            const commissionAmount = (item.total * commissionRate) / 100;
            const companyAmount = item.total - commissionAmount;

            const commission = new Commission({
              order: order._id,
              affiliate: validTrackingInfo.affiliateId,
              company: validTrackingInfo.companyId,
              product: item.product,
              campaign: validTrackingInfo.campaignId,
              orderAmount: item.total,
              commissionRate,
              commissionAmount,
              companyAmount,
              status: 'processed'
            });

            await commission.save();
          }
        }

        order.commissionProcessed = true;
        await order.save();
      }

      return response.ok(res, {
        order,
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      return response.error(res, error);
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('items.product')
        .populate('trackingInfo.affiliateId', 'name email')
        .populate('trackingInfo.companyId', 'name email')
        .populate('trackingInfo.campaignId', 'name');

      if (!order) {
        return response.notFound(res, 'Order not found');
      }

      return response.ok(res, order);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getOrderByOrderId: async (req, res) => {
    try {
      const order = await Order.findOne({ orderId: req.params.orderId })
        .populate('items.product')
        .populate('trackingInfo.affiliateId', 'name email')
        .populate('trackingInfo.companyId', 'name email')
        .populate('trackingInfo.campaignId', 'name');

      if (!order) {
        return response.notFound(res, 'Order not found');
      }

      return response.ok(res, order);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!order) {
        return response.notFound(res, 'Order not found');
      }

      return response.ok(res, {
        order,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAffiliateCommissions: async (req, res) => {
    try {
      const affiliateId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const commissions = await Commission.find({ affiliate: affiliateId })
        .populate('order', 'orderId createdAt status')
        .populate('product', 'name')
        .populate('campaign', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCommission = await Commission.aggregate([
        { $match: { affiliate: new mongoose.Types.ObjectId(affiliateId) } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      return response.ok(res, {
        commissions,
        totalCommission: totalCommission[0]?.total || 0,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(commissions.length / limit),
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCompanyOrders: async (req, res) => {
    try {
      const companyId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const orders = await Order.find({ 'trackingInfo.companyId': companyId })
        .populate('items.product')
        .populate('trackingInfo.affiliateId', 'name email')
        .populate('trackingInfo.campaignId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalRevenue = await Commission.aggregate([
        { $match: { company: new mongoose.Types.ObjectId(companyId) } },
        { $group: { _id: null, total: { $sum: '$companyAmount' } } }
      ]);

      return response.ok(res, {
        orders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(orders.length / limit),
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAffiliateCommissionedProducts: async (req, res) => {
    try {
      const affiliateId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const commissionedProducts = await Commission.aggregate([
        { $match: { affiliate: new mongoose.Types.ObjectId(affiliateId) } },
        {
          $group: {
            _id: '$product',
            totalCommission: { $sum: '$commissionAmount' },
            totalOrders: { $sum: 1 },
            lastOrderDate: { $max: '$createdAt' },
            campaign: { $first: '$campaign' }
          }
        },
        { $sort: { lastOrderDate: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      ]);

    
      const populatedProducts = await Product.populate(commissionedProducts, [
        { path: '_id', select: 'name price offer_price product_image affiliate_commission coustomer_discount createdAt' },
        { path: 'campaign', select: 'name' }
      ]);

      return response.ok(res, {
        products: populatedProducts.map(item => ({
          ...item._id.toObject(),
          totalCommission: item.totalCommission,
          totalOrders: item.totalOrders,
          lastOrderDate: item.lastOrderDate,
          campaign: item.campaign
        })),
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      let query = {};
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('items.product', 'name price')
        .populate('trackingInfo.affiliateId', 'name email')
        .populate('trackingInfo.companyId', 'name email')
        .populate('trackingInfo.campaignId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);

      const stats = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            }
          }
        }
      ]);

      return response.ok(res, {
        orders,
        stats: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      return response.error(res, error);
    }
  }
};