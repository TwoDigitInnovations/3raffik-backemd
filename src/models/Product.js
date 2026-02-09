'use strict';

const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        product_image: {
            type: String,
        },
        manufacturer_name: {
            type: String,
        },
        manufacturer_address: {
            type: String,
        },
        expiry_date: {
            type: String,
        },
        details: {
            type: String,
        },
        unit: {
            type: String,
        },
        qty: {
            type: String,
        },
        offer_price: {
            type: String,
        },
        price: {
            type: String,
        },
        affiliate_commission: {
            type: String,
        },
        coustomer_discount: {
            type: String,
        },
        campaign: { 
          type: mongoose.Types.ObjectId, 
          ref: "Campaign" 
        },
        status: {
            type: String,
            enum: ['Pending', 'Verified', 'Suspended'],
            default: 'Pending',
        },
    }, {
    timestamps: true
});

productSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Product', productSchema);