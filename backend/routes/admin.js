const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bet = require('../models/Bet');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 📊 1. ADMIN DASHBOARD OVERVIEW STATS
// 🔒 ගේට්ටු දෙකම දානවා: ලොග් වෙලා ඉන්නත් ඕනේ, ඇඩ්මින් කෙනෙක් වෙන්නත් ඕනේ!
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        // i. සිස්ටම් එකේ ඉන්න මුළු ප්ලේයර්ස්ලා ගණන (ඇඩ්මින්ලා නැතුව)
        const totalPlayers = await User.countDocuments({ role: 'user' });

        // ii. ප්ලේයර්ස්ලාගේ වොලට් වල දැනට තියෙන මුළු සල්ලි එකතුව (Total Liability)
        const totalWalletBalances = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        const platformLiability = totalWalletBalances[0]?.total || 0;

        // iii. ගේම් එකෙන් සිදුවී ඇති මුළු බෙට්ස් ප්‍රමාණය සහ සර්වර් එකේ ලාභය (Profit) කැල්කියුලේට් කිරීම
        // ප්ලේයර්ස්ලා පැරදුණු සල්ලි සර්වර් එකේ ලාභයයි. දින්න සල්ලි සර්වර් එකෙන් අඩු වෙන්න ඕනේ.
        const allBets = await Bet.find({});
        let totalBetAmount = 0;
        let totalPayoutAmount = 0;

        allBets.forEach(bet => {
            totalBetAmount += bet.amount;
            totalPayoutAmount += bet.payout; // දින්නොත් payout එකක් තියෙනවා, පැරදුණොත් 0යි
        });

        // 💰 House Profit = (මුළු ඔට්ටු තැබූ මුදල - මුළු දිනූ අයට ගෙවූ මුදල)
        const houseProfit = totalBetAmount - totalPayoutAmount;

        return res.json({
            success: true,
            stats: {
                totalPlayers,
                platformLiability,
                totalBetsCount: allBets.length,
                houseProfit
            }
        });

    } catch (err) {
        console.error("Admin Stats Error:", err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;