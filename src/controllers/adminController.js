const User = require('@models/User');
const Campaign = require('@models/campaign');
const Product = require('@models/Product');
const Order = require('@models/Order');
const AdminCommission = require('@models/AdminCommission');
const response = require('../responses');

module.exports = {
  
  getDashboardStats: async (req, res) => {
    try {
      const totalCompanies = await User.countDocuments({ role: 'company' });
      const totalCampaigns = await Campaign.countDocuments();
      const totalAffiliates = await User.countDocuments({ role: 'user' });
      
      const transactionResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);
      
      const totalTransactions = transactionResult.length > 0 ? transactionResult[0].totalAmount : 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%d/%m/%Y', date: '$createdAt' }
            },
            campaigns: { $sum: 1 },
            affiliates: { $sum: 1 },
            companies: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            campaigns: 1,
            affiliates: 1,
            companies: 1
          }
        }
      ]);

      return response.ok(res, {
        totalCompanies,
        totalCampaigns,
        totalAffiliates,
        totalTransactions,
        chartData: dailyStats
      });
    } catch (error) {
      return response.error(res, error);
    }
  },


  getAllCompanies: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      let query = { role: 'company' };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const companies = await User.find(query, '-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      return response.ok(res, {
        companies,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },


  getCompanyById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const company = await User.findById(id, '-password');
      
      if (!company || company.role !== 'company') {
        return response.notFound(res, { message: 'Company not found' });
      }

      return response.ok(res, company);
    } catch (error) {
      return response.error(res, error);
    }
  },


  updateCompanyStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['verified', 'suspended', 'pending'].includes(status)) {
        return response.badReq(res, { message: 'Invalid status' });
      }

      const company = await User.findById(id);
      
      if (!company || company.role !== 'company') {
        return response.notFound(res, { message: 'Company not found' });
      }

      company.status = status;
      await company.save();

      return response.ok(res, {
        message: `Company ${status} successfully`,
        company: await User.findById(id, '-password'),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },


  deleteCompany: async (req, res) => {
    try {
      const { id } = req.params;

      const company = await User.findById(id);
      
      if (!company || company.role !== 'company') {
        return response.notFound(res, { message: 'Company not found' });
      }

      await User.findByIdAndDelete(id);

      return response.ok(res, { message: 'Company deleted successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },


  getAllCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      let query = {};
      
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const campaigns = await Campaign.find(query)
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Campaign.countDocuments(query);

      return response.ok(res, {
        campaigns,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

 
  getCampaignById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const campaign = await Campaign.findById(id).populate('created_by', 'name email');
      
      if (!campaign) {
        return response.notFound(res, { message: 'Campaign not found' });
      }

      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Update campaign status (verify/suspend)
  updateCampaignStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verified_status } = req.body;

      const campaign = await Campaign.findById(id);
      
      if (!campaign) {
        return response.notFound(res, { message: 'Campaign not found' });
      }

      if (status && ['Active', 'Inactive'].includes(status)) {
        campaign.status = status;
      }

      if (verified_status && ['Pending', 'Verified', 'Rejected'].includes(verified_status)) {
        campaign.verified_status = verified_status;
      }

      await campaign.save();

      return response.ok(res, {
        message: 'Campaign updated successfully',
        campaign: await Campaign.findById(id).populate('created_by', 'name email'),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Get all affiliates (users with role 'user')
  getAllAffiliates: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      let query = { role: 'user' };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const affiliates = await User.find(query, '-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      return response.ok(res, {
        affiliates,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Get affiliate by ID
  getAffiliateById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const affiliate = await User.findById(id, '-password');
      
      if (!affiliate || affiliate.role !== 'user') {
        return response.notFound(res, { message: 'Affiliate not found' });
      }

      return response.ok(res, affiliate);
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Update affiliate status (verify/suspend)
  updateAffiliateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['verified', 'suspended', 'pending'].includes(status)) {
        return response.badReq(res, { message: 'Invalid status' });
      }

      const affiliate = await User.findById(id);
      
      if (!affiliate || affiliate.role !== 'user') {
        return response.notFound(res, { message: 'Affiliate not found' });
      }

      affiliate.status = status;
      await affiliate.save();

      return response.ok(res, {
        message: `Affiliate ${status} successfully`,
        affiliate: await User.findById(id, '-password'),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      let query = {};
      
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      const products = await Product.find(query)
        .populate({
          path: 'campaign',
          select: 'name',
          populate: {
            path: 'created_by',
            select: 'name email'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(query);

      return response.ok(res, {
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Get product by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id).populate({
        path: 'campaign',
        select: 'name',
        populate: {
          path: 'created_by',
          select: 'name email'
        }
      });
      
      if (!product) {
        return response.notFound(res, { message: 'Product not found' });
      }

      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  // Update product status (Pending/Verified/Suspended)
  updateProductStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Pending', 'Verified', 'Suspended'].includes(status)) {
        return response.badReq(res, { message: 'Invalid status' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return response.notFound(res, { message: 'Product not found' });
      }

      product.status = status;
      await product.save();

      return response.ok(res, {
        message: `Product ${status.toLowerCase()} successfully`,
        product: await Product.findById(id).populate({
          path: 'campaign',
          select: 'name',
          populate: {
            path: 'created_by',
            select: 'name email'
          }
        }),
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getWalletStats: async (req, res) => {
    try {
      const totalOrders = await Order.countDocuments();
      
      const totalRevenueResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);
      
      const adminCommissionResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalCommission: { $sum: '$admin_commission' }
          }
        }
      ]);
      
      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalAmount : 0;
      const adminCommission = adminCommissionResult.length > 0 ? adminCommissionResult[0].totalCommission : 0;
      
      const recentTransactions = await Order.find()
        .populate('trackingInfo.affiliateId', 'name email')
        .populate('trackingInfo.companyId', 'name email')
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 })
        .limit(50);
      
      return response.ok(res, {
        totalOrders,
        totalRevenue,
        adminCommission,
        recentTransactions
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCommissionSettings: async (req, res) => {
    try {
      let commissionSetting = await AdminCommission.findOne({ is_active: true })
        .populate('updated_by', 'name email');
      
      if (!commissionSetting) {
        commissionSetting = new AdminCommission({
          commission_percentage: 5,
          updated_by: req.user._id
        });
        await commissionSetting.save();
      }
      
      return response.ok(res, commissionSetting);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateCommissionSettings: async (req, res) => {
    try {
      const { commission_percentage } = req.body;
      
      if (commission_percentage < 0 || commission_percentage > 100) {
        return response.badReq(res, { message: 'Commission percentage must be between 0 and 100' });
      }
      
      await AdminCommission.updateMany({ is_active: true }, { is_active: false });
      
      const newCommissionSetting = new AdminCommission({
        commission_percentage,
        updated_by: req.user._id
      });
      
      await newCommissionSetting.save();
      
      return response.ok(res, { message: 'Commission settings updated successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  }
};
