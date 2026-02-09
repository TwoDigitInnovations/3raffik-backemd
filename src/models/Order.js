'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { 
        type: mongoose.Types.ObjectId, 
        ref: "Product",
        required: true
    },
    name: String,
    price: Number,
    quantity: {
        type: Number,
        default: 1
    },
    total: Number
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        name: String,
        mobile: String,
        email: String
    },
    items: [orderItemSchema],
    shippingAddress: {
        name: String,
        mobile: String,
        address: String,
        locality: String,
        city: String,
        state: String,
        pincode: String,
        addressType: String
    },
    paymentMethod: String,
    totalAmount: {
        type: Number,
        required: true
    },
    admin_commission: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    trackingInfo: {
        affiliateId: { type: mongoose.Types.ObjectId, ref: "User" },
        campaignId: { type: mongoose.Types.ObjectId, ref: "Campaign" },
        companyId: { type: mongoose.Types.ObjectId, ref: "User" }
    },
    commissionProcessed: {
        type: Boolean,
        default: false
    },
    estimatedDelivery: Date
}, {
    timestamps: true
});

orderSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Order', orderSchema);