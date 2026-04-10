'use strict';

const mongoose = require('mongoose');

const referralCommissionSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Types.ObjectId, 
        ref: "Order",
        required: true
    },
    referringAffiliate: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    company: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    orderAmount: {
        type: Number,
        required: true
    },
    commissionRate: {
        type: Number,
        default: 2
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'paid'],
        default: 'pending'
    }
}, {
    timestamps: true
});

referralCommissionSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('ReferralCommission', referralCommissionSchema);
