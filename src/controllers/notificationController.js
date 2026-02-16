const Notification = require('@models/notification');
const CampaignConnection = require('@models/CampaignConnection');
const Campaign = require('@models/campaign');
const User = require('@models/User');
const response = require("../responses");
const { sendPushNotification } = require('@services/oneSignal');

module.exports = {
    sendConnectionRequest: async (req, res) => {
        try {
            const { affiliate_id, company_id, campaign_id } = req.body;
            const from_id = req.user._id;
            const to_id = affiliate_id || company_id;
            
            if (campaign_id) {
                const campaign = await Campaign.findById(campaign_id).populate('created_by');
                if (!campaign) {
                    return response.notFound(res, { message: 'Campaign not found' });
                }
                
                const existingConnection = await CampaignConnection.findOne({
                    campaign_id,
                    affiliate_id: from_id,
                    company_id: campaign.created_by._id
                });
                
                if (existingConnection) {
                    if (existingConnection.status === 'pending') {
                        return response.badReq(res, { message: 'Connection request already sent for this campaign' });
                    } else if (existingConnection.status === 'accepted') {
                        return response.badReq(res, { message: 'Already connected to this campaign' });
                    } else if (existingConnection.status === 'rejected') {
                        existingConnection.status = 'pending';
                        await existingConnection.save();
                        
                        const notification = new Notification({
                            title: 'Campaign Connection Request',
                            description: `Connection request for campaign: ${campaign.name}`,
                            type: 'connection_request',
                            from: from_id,
                            for: [campaign.created_by._id],
                            status: 'pending'
                        });
                        
                        await notification.save();

                        console.log('=== PUSH NOTIFICATION DEBUG ===');
                        console.log('Company OneSignal IDs:', campaign.created_by.oneSignalIds);
                        console.log('Affiliate Name:', req.user.name);
                        console.log('Campaign Name:', campaign.name);
                        
                        if (campaign.created_by.oneSignalIds && campaign.created_by.oneSignalIds.length > 0) {
                            console.log('Sending push notification to company...');
                            const result = await sendPushNotification(
                                campaign.created_by.oneSignalIds,
                                'New Connection Request',
                                `${req.user.name} sent a connection request for ${campaign.name}`,
                                { type: 'connection_request', notification_id: notification._id.toString() }
                            );
                            console.log('Push notification result:', result);
                        } else {
                            console.log('No OneSignal IDs found for company');
                        }
                        console.log('=== END DEBUG ===');
                        
                        return response.ok(res, { message: 'Campaign connection request sent successfully' });
                    }
                }
                
                const campaignConnection = new CampaignConnection({
                    campaign_id,
                    affiliate_id: from_id,
                    company_id: campaign.created_by._id,
                    status: 'pending'
                });
                
                await campaignConnection.save();
                
                const notification = new Notification({
                    title: 'Campaign Connection Request',
                    description: `Connection request for campaign: ${campaign.name}`,
                    type: 'connection_request',
                    from: from_id,
                    for: [campaign.created_by._id],
                    status: 'pending'
                });
                
                await notification.save();

                console.log('=== PUSH NOTIFICATION DEBUG ===');
                console.log('Company OneSignal IDs:', campaign.created_by.oneSignalIds);
                console.log('Affiliate Name:', req.user.name);
                console.log('Campaign Name:', campaign.name);
                
                if (campaign.created_by.oneSignalIds && campaign.created_by.oneSignalIds.length > 0) {
                    console.log('Sending push notification to company...');
                    const result = await sendPushNotification(
                        campaign.created_by.oneSignalIds,
                        'New Connection Request',
                        `${req.user.name} sent a connection request for ${campaign.name}`,
                        { type: 'connection_request', notification_id: notification._id.toString() }
                    );
                    console.log('Push notification result:', result);
                } else {
                    console.log('No OneSignal IDs found for company');
                }
                console.log('=== END DEBUG ===');
                
                return response.ok(res, { message: 'Campaign connection request sent successfully' });
            }
            
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

            const toUser = await User.findById(to_id);
            if (toUser && toUser.oneSignalIds && toUser.oneSignalIds.length > 0) {
                await sendPushNotification(
                    toUser.oneSignalIds,
                    'New Connection Request',
                    `${req.user.name} sent you a connection request`,
                    { type: 'connection_request', notification_id: notification._id.toString() }
                );
            }
            
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
            
            console.log('=== UPDATE NOTIFICATION STATUS ===');
            console.log('Notification ID:', notification_id);
            console.log('New Status:', status);
            
            const notification = await Notification.findByIdAndUpdate(
                notification_id,
                { status, read: true },
                { new: true }
            ).populate('from');
            
            if (!notification) {
                return response.notFound(res, { message: 'Notification not found' });
            }
            
            console.log('Notification found:', notification.description);
            
            if (notification.description && notification.description.includes('campaign:')) {
                const campaignConnection = await CampaignConnection.findOne({
                    affiliate_id: notification.from._id,
                    company_id: req.user._id
                }).populate('campaign_id');
                
                console.log('Campaign Connection found:', campaignConnection);
                
                if (campaignConnection) {
                    console.log('Old status:', campaignConnection.status);
                    campaignConnection.status = status;
                    await campaignConnection.save();
                    console.log('New status saved:', status);

                    const affiliate = await User.findById(notification.from._id);
                    if (affiliate && affiliate.oneSignalIds && affiliate.oneSignalIds.length > 0) {
                        const statusText = status === 'accepted' ? 'accepted' : 'rejected';
                        const campaignName = campaignConnection.campaign_id?.name || 'campaign';
                        await sendPushNotification(
                            affiliate.oneSignalIds,
                            `Connection Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
                            `Your connection request for ${campaignName} has been ${statusText}`,
                            { type: 'connection_response', status, campaign_id: campaignConnection.campaign_id?._id?.toString() }
                        );
                    }
                }
            }
            
            console.log('=== END UPDATE ===');
            return response.ok(res, { message: `Connection request ${status}` });
        } catch (error) {
            console.error('Update notification error:', error);
            return response.error(res, error);
        }
    },

    checkCampaignConnection: async (req, res) => {
        try {
            const { campaign_id } = req.params;
            const affiliate_id = req.user._id;
            
            const connection = await CampaignConnection.findOne({
                campaign_id,
                affiliate_id
            });
            
            if (!connection) {
                return response.ok(res, { 
                    connected: false,
                    status: 'not_requested'
                });
            }
            
            return response.ok(res, { 
                connected: connection.status === 'accepted',
                status: connection.status
            });
        } catch (error) {
            return response.error(res, error);
        }
    }
}