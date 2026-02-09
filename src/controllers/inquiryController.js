const Inquiry = require('@models/Inquiry');
const response = require('../responses');

module.exports = {

  submitInquiry: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return response.error(res, 'All fields are required', 400);
      }

      const inquiryData = {
        name,
        email,
        subject,
        message,
        status: 'pending',
      };

  
      if (req.user && req.user._id) {
        inquiryData.user = req.user._id;
      }

      const inquiry = new Inquiry(inquiryData);
      await inquiry.save();

      return response.ok(res, {
        message: 'Inquiry submitted successfully',
        inquiry,
      });
    } catch (error) {
      console.error('Submit inquiry error:', error);
      return response.error(res, error);
    }
  },


  getAllInquiries: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      
      let query = {};
      if (status) {
        query.status = status;
      }

      const inquiries = await Inquiry.find(query)
        .populate('user', 'name email')
        .populate('responded_by', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Inquiry.countDocuments(query);

      return response.ok(res, {
        inquiries,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Get inquiries error:', error);
      return response.error(res, error);
    }
  },

  
  getMyInquiries: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const inquiries = await Inquiry.find({ user: req.user._id })
        .populate('responded_by', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Inquiry.countDocuments({ user: req.user._id });

      return response.ok(res, {
        inquiries,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Get my inquiries error:', error);
      return response.error(res, error);
    }
  },

 
  getInquiryById: async (req, res) => {
    try {
      const inquiry = await Inquiry.findById(req.params.id)
        .populate('user', 'name email')
        .populate('responded_by', 'name email');

      if (!inquiry) {
        return response.error(res, 'Inquiry not found', 404);
      }

      return response.ok(res, inquiry);
    } catch (error) {
      console.error('Get inquiry error:', error);
      return response.error(res, error);
    }
  },

 
  updateInquiry: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response: inquiryResponse } = req.body;

      const updateData = {};
      
      if (status) {
        updateData.status = status;
      }
      
      if (inquiryResponse) {
        updateData.response = inquiryResponse;
        updateData.responded_at = new Date();
        updateData.responded_by = req.user._id;
      }

      const inquiry = await Inquiry.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('user', 'name email').populate('responded_by', 'name email');

      if (!inquiry) {
        return response.error(res, 'Inquiry not found', 404);
      }

      return response.ok(res, {
        message: 'Inquiry updated successfully',
        inquiry,
      });
    } catch (error) {
      console.error('Update inquiry error:', error);
      return response.error(res, error);
    }
  },


  deleteInquiry: async (req, res) => {
    try {
      const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

      if (!inquiry) {
        return response.error(res, 'Inquiry not found', 404);
      }

      return response.ok(res, { message: 'Inquiry deleted successfully' });
    } catch (error) {
      console.error('Delete inquiry error:', error);
      return response.error(res, error);
    }
  },
};
