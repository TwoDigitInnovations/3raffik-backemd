const User = require('@models/User');
const Campaign = require('@models/campaign');
const Product = require('@models/Product');
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
  }
};