const Policy = require('@models/Policy');
const response = require('../responses');

module.exports = {
 
  getPolicy: async (req, res) => {
    try {
      const { type } = req.params;
      
      if (!['privacy', 'terms'].includes(type)) {
        return response.badReq(res, { message: 'Invalid policy type' });
      }

      let policy = await Policy.findOne({ type });
      
      if (!policy) {
        policy = await Policy.create({ type, content: '' });
      }

      return response.ok(res, policy);
    } catch (error) {
      return response.error(res, error);
    }
  },


  updatePolicy: async (req, res) => {
    try {
      const { type } = req.params;
      const { content } = req.body;

      if (!['privacy', 'terms'].includes(type)) {
        return response.badReq(res, { message: 'Invalid policy type' });
      }

      if (!content) {
        return response.badReq(res, { message: 'Content is required' });
      }

      const policy = await Policy.findOneAndUpdate(
        { type },
        { 
          content,
          updatedBy: req.user.id
        },
        { new: true, upsert: true }
      );

      return response.ok(res, { 
        policy,
        message: `${type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'} updated successfully` 
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

 
  getAllPolicies: async (req, res) => {
    try {
      const policies = await Policy.find().populate('updatedBy', 'name email');
      return response.ok(res, policies);
    } catch (error) {
      return response.error(res, error);
    }
  }
};
