'use strict';

const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
    affiliate: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    product: { 
        type: mongoose.Types.ObjectId, 
        ref: "Product",
        required: true
    },
    campaign: { 
        type: mongoose.Types.ObjectId, 
        ref: "Campaign",
        required: true
    },
    company: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    clickType: {
        type: String,
        enum: ['qr_scan', 'link_share'],
        default: 'link_share'
    },
    ipAddress: String,
    userAgent: String,
    converted: {
        type: Boolean,
        default: false
    },
    orderId: {
        type: mongoose.Types.ObjectId,
        ref: "Order"
    }
}, {
    timestamps: true
});

clickSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Click', clickSchema);
