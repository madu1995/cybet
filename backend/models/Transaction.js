const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, default: 'deposit' }, // deposit / withdrawal
    slipUrl: { type: String, required: true }, // Player upload කරපු slip එකේ image path එක
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    },
        {timestamps: true // ගනුදෙනුව සිදු වුණු දවස සහ වෙලාව (Date & Time) මේකෙන් ඔටෝ සේව් වෙනවා
});

module.exports = mongoose.model('Transaction', TransactionSchema);