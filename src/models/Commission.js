'use strict';

const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Types.ObjectId, 
        ref: "Order",
        required: true
    },
    affiliate: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    company: { 
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
    orderAmount: {
        type: Number,
        required: true
    },
    commissionRate: {
        type: Number,
        required: true
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    companyAmount: {
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

commissionSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Commission', commissionSchema);