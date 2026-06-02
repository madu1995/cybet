const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // මේ ගනුදෙනුව අයිති යූසර්ගේ ID එක
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal_request', 'withdrawal_approved', 'game_win', 'game_loss'],
        required: true
        // deposit = ඇඩ්මින් සල්ලි දාපුවා
        // withdrawal_request = යූසර් විඩ්‍රෝ එකක් දාපු ගමන් (බැලන්ස් එක 0 වෙලා පෙන්ඩින් වෙනවා)
        // withdrawal_approved = ඇඩ්මින් සල්ලි අතට දීලා ඇප් එකෙන් එපෘව් කරපුවා
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed' // ගේම් දිනුම්/පැරදුම් කෙලින්ම completed වෙනවා, withdrawal විතරක් pending වෙන්න පුළුවන්
    },
    description: {
        type: String // උදා: "Won from Dice 4", "Withdrawal approved by Admin"
    }
}, {
    timestamps: true // ගනුදෙනුව සිදු වුණු දවස සහ වෙලාව (Date & Time) මේකෙන් ඔටෝ සේව් වෙනවා
});

module.exports = mongoose.model('Transaction', TransactionSchema);