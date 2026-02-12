const Product = require('@models/Product');
const Campaign = require('@models/campaign');
const response = require('../responses');

module.exports = {
  create_product: async (req, res) => {
    try {
      req.body.created_by = req.user._id;
      if (req.file) {
        req.body.product_image = req.file.location;
      }
      
      let product = new Product(req.body);
      await product.save();
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductByCompany: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let cond = { 
        campaign: req.query.campaign_id
      };

      // If user is affiliate (not company owner), exclude suspended products and rejected campaigns
      if (req.user.role === 'user') {
        cond.status = { $ne: 'Suspended' };
      }

      if (req?.query?.key) {
        cond.name = { $regex: req.query.key, $options: 'i' };
      }
      
      let product = await Product.find(cond)
        .populate('campaign', 'name verified_status created_by')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      // If user is affiliate, filter out products with rejected campaigns
      if (req.user.role === 'user') {
        product = product.filter(p => 
          p.campaign && p.campaign.verified_status !== 'Rejected'
        );
      }
      
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductForWebsite: async (req, res) => {
    try {
      const { productId, campaignId, affiliateId, companyId } = req.query;
      
      let product = await Product.findOne({ 
        _id: productId,
        status: { $ne: 'Suspended' } // Exclude suspended products
      }).populate({
        path: 'campaign',
        populate: {
          path: 'created_by',
          select: 'name email'
        }
      });
      
      if (!product) {
        return response.notFound(res, 'Product not found or suspended');
      }

      // Check if campaign is rejected
      if (product.campaign && product.campaign.verified_status === 'Rejected') {
        return response.notFound(res, 'Product campaign is rejected');
      }

     
      const actualCompanyId = product.campaign?.created_by?._id || companyId;

      return response.ok(res, {
        product,
        tracking: {
          affiliateId,
          campaignId,
          companyId: actualCompanyId 
        }
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductById: async (req, res) => {
    try {
      let product = await Product.findById(req.params.id);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateProduct: async (req, res) => {
    try {
     
      if (req.file) {
        req.body.product_image = req.file.location;
      }
      
      let product = await Product.findByIdAndUpdate(req.body.id, req.body, { new: true });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteProductById: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      return response.ok(res, { message: 'Deleted successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },


  getAllProducts: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let cond = {
        status: { $ne: 'Suspended' } // Exclude suspended products from frontend
      };
      
      if (req?.query?.search) {
        cond.name = { $regex: req.query.search, $options: 'i' };
      }
      
      let products = await Product.find(cond)
        .populate('campaign', 'name verified_status')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      // Filter out products with rejected campaigns
      products = products.filter(product => 
        product.campaign && product.campaign.verified_status !== 'Rejected'
      );
      
      const total = await Product.countDocuments(cond);
      
      return response.ok(res, {
        products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductCountByCampaign: async (req, res) => {
    try {
      const count = await Product.countDocuments({ campaign: req.params.campaign_id });
      return response.ok(res, { count });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateProductStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!product) {
        return response.notFound(res, 'Product not found');
      }
      return response.ok(res, { product, message: 'Product status updated successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },
};
