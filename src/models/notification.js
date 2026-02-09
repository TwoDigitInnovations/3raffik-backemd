'use strict';

const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ['connection_request', 'general'],
            default: 'general'
        },
        from: { 
            type: mongoose.Types.ObjectId, 
            ref: "User" 
        },
        for: [{ 
            type: mongoose.Types.ObjectId, 
            ref: "User" 
        }],
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        read: {
            type: Boolean,
            default: false
        }
    }, {
    timestamps: true
});

notificationSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Notification', notificationSchema);