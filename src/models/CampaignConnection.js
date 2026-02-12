'use strict';

const mongoose = require('mongoose');

const campaignConnectionSchema = new mongoose.Schema(
    {
        campaign_id: { 
            type: mongoose.Types.ObjectId, 
            ref: "Campaign",
            required: true
        },
        affiliate_id: { 
            type: mongoose.Types.ObjectId, 
            ref: "User",
            required: true
        },
        company_id: { 
            type: mongoose.Types.ObjectId, 
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    }, 
    {
        timestamps: true
    }
);

campaignConnectionSchema.index({ campaign_id: 1, affiliate_id: 1 }, { unique: true });

campaignConnectionSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('CampaignConnection', campaignConnectionSchema);
