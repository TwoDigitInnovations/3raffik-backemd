const authRoutes = require('@routes/authRoutes');
const notificationRoutes = require('@routes/notificationRoutes');
const contentRoute = require('@routes/contentRoute');
const campaignRoute = require('@routes/campaignRoutes');
const productRoute = require('@routes/productRoutes');

module.exports = (app) => {
  app.use('/auth', authRoutes);
  app.use('/notification', notificationRoutes);
  app.use('/content', contentRoute);
  app.use('/campaign', campaignRoute);
  app.use('/product', productRoute);
};
