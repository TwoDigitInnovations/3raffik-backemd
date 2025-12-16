'use strict';

const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
    {

        name: {
            type: String,
        },
        pho_url: {
            type: String,
        },
        pro_det_url: {
            type: String,
        },
        affiliate_commission: {
            type: String,
        },
        campaign: { 
          type: mongoose.Types.ObjectId, 
          ref: "Campaign" 
        },
        coustomer_discount: {
        type: String,
        },
        price: {
        type: String,
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