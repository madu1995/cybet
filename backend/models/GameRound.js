const mongoose = require('mongoose');

const GameRoundSchema = new mongoose.Schema({
    roundNumber: {
        type: Number,
        required: true,
        unique: true // හැම ගේම් රවුන්ඩ් එකකටම අනන්‍ය අංකයක්
    },
    winningResult: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6], // දිනන ඩයිස් අංකය (වැටෙන්නේ rolling ෆේස් එකේදී)
        default: null
    },
    totalBetsAmount: {
        type: Number,
        default: 0 // ඒ රවුන්ඩ් එකේ යාළුවෝ ඔක්කොම එකතු වෙලා දාපු මුළු සල්ලි ගණන
    },
    status: {
        type: String,
        enum: ['betting', 'rolling', 'completed'],
        default: 'betting'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // ⚠️ මෙන්න ඉංජිනේරු වැඩේ! තත්පර 604,800 කියන්නේ හරියටම දවස් 7ක්. 
                       // දවස් 7ක් පිරුණු ගමන් මේ රෙකෝඩ් එක MongoDB එකෙන් ඔටෝම මැකිලා යනවා (TTL Index).
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GameRound', GameRoundSchema);