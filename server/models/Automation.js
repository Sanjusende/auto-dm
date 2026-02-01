const mongoose = require('mongoose');

const AutomationSchema = new mongoose.Schema({
    reelId: {
        type: String,
        required: true
    },
    reelThumbnail: {
        type: String,
        required: true
    },
    triggerKeyword: {
        type: String,
        required: true
    },
    dmMessage: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Automation', AutomationSchema);
