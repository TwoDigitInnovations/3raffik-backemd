const mongoose = require('mongoose');
const Order = require('../models/Order');
const Click = require('../models/Click');
const Product = require('../models/Product');
const Campaign = require('../models/campaign');
require('dotenv').config();


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected for migration'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function migrateOrdersToClicks() {
  try {
    console.log('Starting migration: Creating click entries for existing orders...\n');

    
    const orders = await Order.find({
      'trackingInfo.affiliateId': { $exists: true, $ne: null }
    });

    console.log(`Found ${orders.length} orders with affiliate tracking\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        const affiliateId = order.trackingInfo.affiliateId;
        const companyId = order.trackingInfo.companyId;
        const campaignId = order.trackingInfo.campaignId;
        for (const item of order.items) {
          const productId = item.product._id || item.product;
          const existingClick = await Click.findOne({
            affiliate: affiliateId,
            product: productId,
            orderId: order._id
          });

          if (existingClick) {
            console.log(`Skipping: Click already exists for Order ${order.orderId}, Product ${productId}`);
            skipCount++;
            continue;
          }
          const click = new Click({
            affiliate: affiliateId,
            product: productId,
            campaign: campaignId,
            company: companyId,
            clickType: 'link_share', 
            converted: true,
            orderId: order._id,
            createdAt: order.createdAt, 
            updatedAt: order.updatedAt
          });

          await click.save();
          successCount++;
          console.log(`Created click for Order ${order.orderId}, Product ${productId}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing order ${order.orderId}:`, error.message);
      }
    }

    

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}


migrateOrdersToClicks();
