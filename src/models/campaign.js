'use strict';

const mongoose = require('mongoose');
const campaignSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        photo: {
            type: String,
        },
        description: {
            type: String,
        },
        web_url: {
            type: String,
        },
        created_by: { type: mongoose.Types.ObjectId, ref: "User" },
        status: {
        type: String,
        enum: ['Inactive', 'Active'],
        default: 'Inactive',
        },
        verified_status: {
        type: String,
        enum: ['Pending', 'Verified','Rejected'],
        default: 'Pending',
        },
    }, {
    timestamps: true
});

campaignSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Campaign', campaignSchema);