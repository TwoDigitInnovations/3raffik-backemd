'use strict';

const mongoose = require('mongoose');

const adminCommissionSchema = new mongoose.Schema(
    {
        commission_percentage: {
            type: Number,
            required: true,
            default: 5,
            min: 0,
            max: 100
        },
        is_active: {
            type: Boolean,
            default: true
        },
        updated_by: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true
        }
    }, 
    {
        timestamps: true
    }
);

adminCommissionSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('AdminCommission', adminCommissionSchema);
