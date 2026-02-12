const Click = require('@models/Click');
const Product = require('@models/Product');
const response = require('../responses');

module.exports = {
  
  trackClick: async (req, res) => {
    try {
      const { productId, affiliateId, clickType } = req.body;

      if (!productId || !affiliateId) {
        return response.badReq(res, { message: 'Product ID and Affiliate ID are required' });
      }
      const product = await Product.findById(productId).populate('campaign');
      if (!product) {
        return response.notFound(res, { message: 'Product not found' });
      }

     
      if (!product.campaign) {
        return response.badReq(res, { message: 'Product does not have a campaign associated' });
      }

    
      const companyId = product.campaign.created_by;
      if (!companyId) {
        return response.badReq(res, { message: 'Campaign does not have a company associated' });
      }

     
      const click = new Click({
        affiliate: affiliateId,
        product: productId,
        campaign: product.campaign._id,
        company: companyId,
        clickType: clickType || 'link_share',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      await click.save();

      return response.ok(res, { 
        message: 'Click tracked successfully',
        clickId: click._id 
      });
    } catch (error) {
      console.error('Track click error:', error);
      return response.error(res, error);
    }
  },

  getAffiliateClickStats: async (req, res) => {
    try {
      const affiliateId = req.user.id;

      const totalClicks = await Click.countDocuments({ affiliate: affiliateId });
      const totalConversions = await Click.countDocuments({ 
        affiliate: affiliateId, 
        converted: true 
      });

      const conversionRate = totalClicks > 0 
        ? ((totalConversions / totalClicks) * 100).toFixed(2) 
        : 0;

      return response.ok(res, {
        totalClicks,
        totalConversions,
        conversionRate
      });
    } catch (error) {
      return response.error(res, error);
    }
  }
};
