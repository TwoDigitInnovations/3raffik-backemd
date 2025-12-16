const OneSignal = require('@onesignal/node-onesignal');
const Device = require('@models/Device');
const Notification = require('@models/notification');
const User = require('@models/User');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

const ONESIGNAL_REST_API_KEY = {
  getToken() {
    return process.env.ONESIGNAL_REST_API_KEY;
  },
};
const configuration = OneSignal.createConfiguration({
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
  authMethods: {
    rest_api_key: { tokenProvider: ONESIGNAL_REST_API_KEY },
  },
});
const client = new OneSignal.DefaultApi(configuration);

async function sendNotification(content, player_ids, title) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_subscription_ids = player_ids;
    notification.contents = {
      en: content,
    };
     // if (notifictone) {
      notification.ios_sound=`custom.wav`;
      // notification.android_sound='ordersreceived';
      notification.android_channel_id='dd7d620b-b730-4d81-8243-5763458fc3f4';
    // }
    if (title) {
      notification.headings = {
        en: title,
      };
    }
    notification.name = 'ParkPro';
    return await client.createNotification(notification);
  } catch (err) {
    console.log('error in send notification', content);
    console.error('error in send notification', err);
  }
}
async function findDevices(user) {
  const devices = await Device.find({ user });
  return devices.map((d) => d.player_id);
}

module.exports = {
  notify: async (user, title, content) => {
    const player_ids = await findDevices(user);
    // console.log('player_ids====>', player_ids)
    const notObj = { for: user, description: content, title: title };
    console.log('notobj', notObj);
    await Notification.create(notObj);
    return sendNotification(content, player_ids, title);
  },
  notifyAllUser: async (users, content, job = null, title) => {
    const devices = await User.find();
    console.log('devices===========>', devices);
    const player_ids = devices.map((d) => d._id);

    const notObj = { for: player_ids, description: content, title: title };
    if (job) notObj.invited_for = job;
    await Notification.create(notObj);

    return;
    // sendNotification(content, player_ids, title);
  },
};
