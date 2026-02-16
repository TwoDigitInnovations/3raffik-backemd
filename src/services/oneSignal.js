const OneSignal = require('@onesignal/node-onesignal');

const app_key_provider = {
  getToken() {
    return process.env.REST_API_KEY;
  }
};

const configuration = OneSignal.createConfiguration({
  authMethods: {
    rest_api_key: {
      tokenProvider: app_key_provider
    }
  }
});

const client = new OneSignal.DefaultApi(configuration);

const sendPushNotification = async (userIds, title, message, data = {}) => {
  try {
    console.log('=== ONESIGNAL SERVICE ===');
    console.log('User IDs:', userIds);
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('App ID:', process.env.ONESIGNAL_APP_ID);
    
    if (!userIds || userIds.length === 0) {
      console.log('No user IDs provided for push notification');
      return null;
    }

    const notification = new OneSignal.Notification();
    notification.app_id = process.env.ONESIGNAL_APP_ID;
    notification.include_external_user_ids = userIds;
    notification.contents = { en: message };
    notification.headings = { en: title };
    notification.data = data;

    console.log('Sending notification to OneSignal...');
    const result = await client.createNotification(notification);
    console.log('Push notification sent successfully:', result);
    console.log('=== END ONESIGNAL SERVICE ===');
    return result;
  } catch (error) {
    console.error('=== ONESIGNAL ERROR ===');
    console.error('Error sending push notification:', error.message);
    console.error('Error details:', error);
    console.error('=== END ERROR ===');
    return null;
  }
};

module.exports = {
  sendPushNotification
};
