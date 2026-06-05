const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 5000 },
    role: { type: String, default: 'user' },
    currentBet: {
        number: { type: Number, default: null },
        amount: { type: Number, default: 0 },
        betType: { type: String, default: 'NUMBER' },
        multiplier: { type: Number, default: 2 },
        potentialPayout: { type: Number, default: 0 }
    },
    // ❄️ එකවුන්ට් එක Freeze කරලාද නැද්ද කියලා බලන්න
    isFrozen: { type: Boolean, default: false },
    // 🕒 අවසානයටම Active වුණු වෙලාව සටහන් කරගන්න
    lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);