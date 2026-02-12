const Campaign = require('@models/campaign');
const response = require('../responses');

module.exports = {
  create_campaign: async (req, res) => {
    try {
      req.body.created_by = req.user._id;
      if (req.file && req.file.location) {
        req.body.photo = req.file.location;
      }
      let campaign = new Campaign(req.body);
      await campaign.save();
      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCampaignByCompany: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let cond = { created_by: req.user._id };
      if (req?.query?.key) {
        cond.name = { $regex: req.query.key, $options: 'i' };
      }
      if (req?.query?.selectedStatus) {
        cond.status = req?.query.selectedStatus;
      }
      if (req?.query?.selectedVerification) {
        cond.verified_status = req?.query.selectedVerification;
      }
      let campaign = await Campaign.find(cond)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCampaignById: async (req, res) => {
    try {
      let campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return response.notFound(res, 'Campaign not found');
      }

      // If user is not the campaign owner and campaign is rejected, don't show it
      if (campaign.verified_status === 'Rejected' && 
          campaign.created_by.toString() !== req.user._id.toString()) {
        return response.notFound(res, 'Campaign not found or rejected');
      }
      
      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateCampaign: async (req, res) => {
    try {
      if (req.file && req.file.location) {
        req.body.photo = req.file.location;
      }
      let campaign = await Campaign.findByIdAndUpdate(req.body.id, req.body);
      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteCampaignById: async (req, res) => {
    try {
      await Campaign.findByIdAndDelete(req.params.id);
      return response.ok(res, { message: 'Deleted successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAllCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let cond = {
        verified_status: { $ne: 'Rejected' } // Exclude rejected campaigns from frontend
      };
      if (req?.query?.key) {
        cond.name = { $regex: req.query.key, $options: 'i' };
      }
      if (req?.query?.selectedStatus) {
        cond.status = req?.query.selectedStatus;
      }
      if (req?.query?.selectedVerification) {
        cond.verified_status = req?.query.selectedVerification;
      }
      let campaign = await Campaign.find(cond)
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, campaign);
    } catch (error) {
      return response.error(res, error);
    }
  },
};
