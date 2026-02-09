const Notification = require('@models/notification');
const response = require("../responses");

module.exports = {
    sendConnectionRequest: async (req, res) => {
        try {
            const { affiliate_id, company_id } = req.body;
            const from_id = req.user._id;
            const to_id = affiliate_id || company_id;
            
            const existingRequest = await Notification.findOne({
                from: from_id,
                for: to_id,
                type: 'connection_request',
                status: 'pending'
            });
            
            if (existingRequest) {
                return response.badReq(res, { message: 'Connection request already sent' });
            }
            
            const notification = new Notification({
                title: 'Connection Request',
                description: `You have a connection request`,
                type: 'connection_request',
                from: from_id,
                for: [to_id],
                status: 'pending'
            });
            
            await notification.save();
            return response.ok(res, { message: 'Connection request sent successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getNotification: async (req, res) => {
        try {
            let notification = await Notification.find()
            return response.ok(res, notification);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getnotificationforapp: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const user_id = req.user._id;
            
            const notifications = await Notification.find({ 
                for: { $in: [user_id] },
                type: 'connection_request'
            })
            .populate('from', 'name email image phone socialMedia')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
            return response.ok(res, notifications);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateNotificationStatus: async (req, res) => {
        try {
            const { notification_id, status } = req.body;
            
            const notification = await Notification.findByIdAndUpdate(
                notification_id,
                { status, read: true },
                { new: true }
            );
            
            if (!notification) {
                return response.notFound(res, { message: 'Notification not found' });
            }
            
            return response.ok(res, { message: `Connection request ${status}` });
        } catch (error) {
            return response.error(res, error);
        }
    }
}