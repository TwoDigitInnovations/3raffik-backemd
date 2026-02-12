const mongoose = require('mongoose');
const User = require('@models/User');
const Campaign = require('@models/campaign');
const Product = require('@models/Product');
const Order = require('@models/Order');
const Commission = require('@models/Commission');
const Click = require('@models/Click');
const response = require('../responses');
const moment = require('moment');

module.exports = {
  
  getDashboardStats: async (req, res) => {
    try {
      const totalCompanies = await User.countDocuments({ role: 'company' });
      const totalAffiliates = await User.countDocuments({ role: 'user' });
      const totalCampaigns = await Campaign.countDocuments();
      const totalProducts = await Product.countDocuments();

      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const campaignsCount = await Campaign.countDocuments({
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        last30Days.push({
          date: date.format('DD/MM/YYYY'),
          campaigns: campaignsCount,
          affiliates: await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }),
          companies: await User.countDocuments({
            role: 'company',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          })
        });
      }

      const stats = {
        totalCompanies,
        totalCampaigns,
        totalAffiliates,
        totalTransactions: totalProducts,
        chartData: last30Days
      };

      return response.ok(res, stats);
    } catch (error) {
      return response.error(res, error);
    }
  },

  
  getCompanyDashboard: async (req, res) => {
    try {
      const companyId = req.user.id;

    
      const orders = await Order.find({ 'trackingInfo.companyId': companyId });
      const totalEarnings = orders.reduce((sum, order) => {
        return sum + (order.totalAmount - (order.admin_commission || 0));
      }, 0);

    
      const totalClicks = orders.length;

     
      const activeCampaigns = await Campaign.countDocuments({ 
        user: companyId,
        status: 'active'
      });

     
      const completedOrders = await Order.countDocuments({
        'trackingInfo.companyId': companyId,
        status: 'delivered'
      });

      
      const chartData = [];
      for (let i = 29; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const dayOrders = await Order.countDocuments({
          'trackingInfo.companyId': companyId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        chartData.push({
          date: date.format('DD/MM'),
          value: dayOrders
        });
      }
      const productStats = await Order.aggregate([
        { $match: { 'trackingInfo.companyId': new mongoose.Types.ObjectId(companyId) } },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' }
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]);

      const totalProducts = await Product.countDocuments({ user: companyId });
      const topSellingCount = productStats.reduce((sum, p) => sum + p.totalSold, 0);

      const stats = {
        totalEarnings: totalEarnings.toFixed(2),
        totalClicks,
        activeCampaigns,
        completedOrders,
        chartData,
        productStats: {
          totalProducts,
          topSellingCount
        }
      };

      return response.ok(res, stats);
    } catch (error) {
      console.error('Company dashboard error:', error);
      return response.error(res, error);
    }
  },

  getAffiliateDashboard: async (req, res) => {
    try {
      const affiliateId = req.user.id;

    
      const commissions = await Commission.find({ affiliate: affiliateId });
      const totalEarnings = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

     
      const totalClicks = await Click.countDocuments({ affiliate: affiliateId });

     
      const conversions = await Click.countDocuments({
        affiliate: affiliateId,
        converted: true
      });

      const revenueOrders = await Order.find({ 
        'trackingInfo.affiliateId': affiliateId
      });
      const totalRevenue = totalEarnings; // Same as earnings - affiliate's commission
      const chartData = [];
      for (let i = 29; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const dayClicks = await Click.countDocuments({
          affiliate: affiliateId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const dayConversions = await Click.countDocuments({
          affiliate: affiliateId,
          converted: true,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        chartData.push({
          date: date.format('DD/MM'),
          clicks: dayClicks,
          conversions: dayConversions
        });
      }

  
      const campaignStats = await Commission.aggregate([
        { $match: { affiliate: new mongoose.Types.ObjectId(affiliateId) } },
        { $group: {
          _id: '$campaign',
          totalEarnings: { $sum: '$commissionAmount' },
          totalOrders: { $sum: 1 }
        }},
        { $sort: { totalEarnings: -1 } },
        { $limit: 2 },
        { $lookup: {
          from: 'campaigns',
          localField: '_id',
          foreignField: '_id',
          as: 'campaignDetails'
        }}
      ]);

      const stats = {
        totalEarnings: totalEarnings.toFixed(2),
        totalClicks,
        conversions,
        totalRevenue: totalRevenue.toFixed(2),
        chartData,
        topCampaigns: campaignStats
      };

      return response.ok(res, stats);
    } catch (error) {
      console.error('Affiliate dashboard error:', error);
      return response.error(res, error);
    }
  }
};