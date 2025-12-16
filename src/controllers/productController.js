const Product = require('@models/Product');
const response = require('../responses');

module.exports = {
  create_product: async (req, res) => {
    try {
      req.body.created_by = req.user._id;
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
      let cond = { campaign: req.query.campaign_id };
      if (req?.query?.key) {
        cond.name = { $regex: req.query.key, $options: 'i' };
      }
      let product = await Product.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
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
      let product = await Product.findByIdAndUpdate(req.body.id, req.body);
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
};
