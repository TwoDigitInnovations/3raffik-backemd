'use strict';

const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Types.ObjectId, 
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    bankDetails: {
        accountNumber: String,
        accountHolderName: String,
        bankName: String,
        ifscCode: String
    },
    transactionId: String,
    rejectionReason: String,
    processedAt: Date,
    processedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

withdrawalSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
