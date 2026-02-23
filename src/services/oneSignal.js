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
    if (!userIds || userIds.length === 0) {
      return null;
    }

    const notification = new OneSignal.Notification();
    notification.app_id = process.env.ONESIGNAL_APP_ID;
    notification.include_external_user_ids = userIds;
    notification.contents = { en: message };
    notification.headings = { en: title };
    notification.data = data;

    const result = await client.createNotification(notification);
    return result;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return null;
  }
};

module.exports = {
  sendPushNotification
};
