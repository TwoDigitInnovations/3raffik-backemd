const User = require('@models/User');
const ReferralCommission = require('@models/ReferralCommission');
const response = require('../responses');
const mongoose = require('mongoose');

module.exports = {
  getReferralLink: async (req, res) => {
    try {
      const affiliateId = req.user._id || req.user.id;
      let affiliate = await User.findById(affiliateId);
      
      if (!affiliate) {
        return response.notFound(res, { message: 'User not found' });
      }
      
      if (!affiliate.referralCode) {
        const generateReferralCode = () => {
          return Math.random().toString(36).substring(2, 10).toUpperCase();
        };

        let isUnique = false;
        let code;
        while (!isUnique) {
          code = generateReferralCode();
          const existing = await User.findOne({ referralCode: code });
          if (!existing) isUnique = true;
        }
        
        affiliate.referralCode = code;
        await affiliate.save();
      }
      
      const referralCode = affiliate.referralCode;
      const referralLink = `${process.env.WEB_URL || 'https://3raffik.com'}/register?ref=${referralCode}`;
      
      return response.ok(res, {
        referralCode,
        referralLink
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getReferredCompanies: async (req, res) => {
    try {
      const affiliateId = req.user._id || req.user.id;
      const { page = 1, limit = 20 } = req.query;
      console.log('getReferredCompanies - User ID:', affiliateId);

      const referredCompanies = await User.find({ 
        referredBy: affiliateId,
        role: 'company'
      }, '-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      console.log('Found companies:', referredCompanies.length);

      const total = await User.countDocuments({ 
        referredBy: affiliateId,
        role: 'company'
      });

      return response.ok(res, {
        companies: referredCompanies,
        total,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('getReferredCompanies Error:', error);
      return response.error(res, error);
    }
  },

  getReferralEarnings: async (req, res) => {
    try {
      const affiliateId = req.user._id || req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const earnings = await ReferralCommission.find({ referringAffiliate: affiliateId })
        .populate('order', 'orderId createdAt status totalAmount')
        .populate('company', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalEarnings = await ReferralCommission.aggregate([
        { $match: { referringAffiliate: new mongoose.Types.ObjectId(affiliateId) } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      const companiesReferred = await User.countDocuments({ 
        referredBy: affiliateId,
        role: 'company'
      });

      return response.ok(res, {
        earnings,
        totalEarnings: totalEarnings[0]?.total || 0,
        companiesReferred,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(earnings.length / limit),
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('getReferralEarnings Error:', error);
      return response.error(res, error);
    }
  },

  getReferralStats: async (req, res) => {
    try {
      const affiliateId = req.user._id || req.user.id;

      const totalCompanies = await User.countDocuments({ 
        referredBy: affiliateId,
        role: 'company'
      });

      const totalEarnings = await ReferralCommission.aggregate([
        { $match: { referringAffiliate: new mongoose.Types.ObjectId(affiliateId) } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      const monthlyEarnings = await ReferralCommission.aggregate([
        { 
          $match: { 
            referringAffiliate: new mongoose.Types.ObjectId(affiliateId),
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            }
          } 
        },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);

      const affiliate = await User.findById(affiliateId);

      return response.ok(res, {
        totalCompanies,
        totalEarnings: totalEarnings[0]?.total || 0,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
        hasReferralCode: !!affiliate?.referralCode
      });
    } catch (error) {
      console.error('getReferralStats Error:', error);
      return response.error(res, error);
    }
  }
};
