const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');
const { protect } = require('../middleware/authMiddleware'); // 🔒 ඔයාගේ Auth middleware එක

// @route   GET /api/bets/my-history
// @desc    Get current user's bet history and stats summary
router.get('/my-history', protect, async (req, res) => {
    try {
        const userId = req.user._id; // Auth middleware එකෙන් ගන්නා User ID එක

        // 1. ඔක්කොම බෙට්ස් හිස්ට්‍රි එක ගන්නවා (අලුත්ම ඒවා උඩට එන්න sort කරනවා)
        const history = await Bet.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20); // Performance එකට උපරිම 50ක් ඇති

        // 2. Statistics Summary එක හදන්න මුළු බෙට්ස් ලිස්ට් එකම ගන්නවා
        const allUserBets = await Bet.find({ userId });

        let totalBets = allUserBets.length;
        let winBets = allUserBets.filter(bet => bet.status === 'WIN').length;
        
        // Win Rate එක calculate කිරීම
        let winRate = totalBets > 0 ? ((winBets / totalBets) * 100).toFixed(1) : 0;

        // Net PNL (Profit/Loss) calculate කිරීම
        // දිනපුවාගෙන් ආපු ලාභය - ඔට්ටු තියන්න ගිය මුළු වියදම
        let totalSpent = allUserBets.reduce((sum, bet) => sum + bet.amount, 0);
        let totalEarned = allUserBets.reduce((sum, bet) => sum + bet.payout, 0);
        let netPNL = totalEarned - totalSpent;

        // Frontend එකට ඩේටා ටික යැවීම
        res.json({
            success: true,
            summary: {
                totalBets,
                winRate: `${winRate}%`,
                netPNL: netPNL >= 0 ? `+Rs.${netPNL.toLocaleString()}` : `-Rs.${Math.abs(netPNL).toLocaleString()}`,
                isPositivePNL: netPNL >= 0
            },
            history
        });

    } catch (error) {
        console.error("Error fetching bet history:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;