const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // ⚡ Fast querying සඳහා index එකක් දාමු
    },
    selectedNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    diceResult: {
        type: Number,
        default: null // ඩයිස් එක රෝල් වෙනකන් null
    },
    status: {
        type: String,
        enum: ['PENDING', 'WIN', 'LOSS'],
        default: 'PENDING'
    },
    betType: { 
        type: String, 
        required: true 
    },
    multiplier: {
         type: Number, 
         required: true
    },
    potentialPayout: {
         type: Number, 
         default: 0 
    },
    payout: {
        type: Number,
        default: 0 // දින්නොත් ලැබෙන ගාණ, පැරදුණොත් 0
    }
}, { timestamps: true }); // CreatedAt මඟින් වෙලාව ඔටෝ හැදෙනවා හිස්ට්රි එක සෝට් කරන්න

module.exports = mongoose.model('Bet', BetSchema);