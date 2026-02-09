const authRoutes = require('@routes/authRoutes');
const notificationRoutes = require('@routes/notificationRoutes');
const contentRoute = require('@routes/contentRoute');
const campaignRoute = require('@routes/campaignRoutes');
const productRoute = require('@routes/productRoutes');
const orderRoute = require('@routes/orderRoutes');
const adminRoute = require('@routes/adminRoutes');
const inquiryRoute = require('@routes/inquiryRoutes');
const policyRoute = require('@routes/policyRoutes');
const dashboardRoute = require('@routes/dashboardRoutes');

module.exports = (app) => {
  app.use('/auth', authRoutes);
  app.use('/notification', notificationRoutes);
  app.use('/content', contentRoute);
  app.use('/campaign', campaignRoute);
  app.use('/product', productRoute);
  app.use('/order', orderRoute);
  app.use('/admin', adminRoute);
  app.use('/inquiry', inquiryRoute);
  app.use('/policy', policyRoute);
  app.use('/dashboard', dashboardRoute);
};
