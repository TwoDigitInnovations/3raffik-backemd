const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const migrateReferralCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const affiliates = await User.find({ 
      role: 'user',
      referralCode: { $exists: false }
    });

    console.log(`Found ${affiliates.length} affiliates without referral codes`);

    for (const affiliate of affiliates) {
      let isUnique = false;
      let code;
      
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await User.findOne({ referralCode: code });
        if (!existing) isUnique = true;
      }

      affiliate.referralCode = code;
      await affiliate.save();
      console.log(`Generated code ${code} for ${affiliate.email}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateReferralCodes();
