const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bet = require('../models/Bet');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');



// 📊 1. ADMIN DASHBOARD OVERVIEW STATS (DYNAMIC LIABILITY WORKING WITH MULTIPLIERS)
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        // i. සිස්ටම් එකේ ඉන්න මුළු ප්ලේයර්ස්ලා ගණන
        const totalPlayers = await User.countDocuments({ role: 'user' });

        // ii. දැනට ලයිව් රවුන්ඩ් එකේ ප්ලේයර්ස්ලා තබා ඇති ඔට්ටු වලින් Dynamic ලැබිලිටි එක ගණනය කිරීම
        // (යූසර්ගේ currentBet.potentialPayout එක එකතු කරයි. එය නැති පරණ දත්ත සඳහා amount * 2 ලෙස fallback වේ)
        const activeUserStats = await User.aggregate([
            { $match: { "currentBet.amount": { $gt: 0 } } },
            {
                $group: {
                    _id: null,
                    totalLiability: { 
                        $sum: { 
                            $ifNull: [ 
                                "$currentBet.potentialPayout", 
                                { $multiply: ["$currentBet.amount", 2] } 
                            ] 
                        } 
                    }
                }
            }
        ]);
        
        const platformLiability = activeUserStats[0]?.totalLiability || 0;

        // iii. ඩේටාබේස් එකෙන් ඉවර වෙච්ච බෙට්ස් වල සාරාංශය පමණක් ගණනය කිරීම
        const betStats = await Bet.aggregate([
            {
                $facet: {
                    // ඔක්කොම බෙට්ස් ගණන
                    "totalCount": [{ $count: "count" }],
                    
                    // ඉවර වෙච්ච බෙට්ස් වල සැබෑ ලාභ/අලාභ (Calculated from WIN / LOSS bets only)
                    "profitStats": [
                        { $match: { status: { $in: ['WIN', 'LOSS'] } } },
                        { 
                            $group: { 
                                _id: null, 
                                totalBetAmount: { $sum: '$amount' }, 
                                totalPayoutAmount: { $sum: '$payout' } 
                            } 
                        }
                    ]
                }
            }
        ]);

        // 📊 Aggregation එකෙන් එන ඩේටා ටික වේරියබල්ස් වලට වෙන් කර ගැනීම
        const totalBetsCount = betStats[0]?.totalCount[0]?.count || 0;
        const totalBetAmount = betStats[0]?.profitStats[0]?.totalBetAmount || 0;
        const totalPayoutAmount = betStats[0]?.profitStats[0]?.totalPayoutAmount || 0;

        // 💰 සැබෑ නිවැරදි ලාභය = (ඉවර වෙච්ච ඔට්ටු වල මුදල - දිනූ අයට ගෙවූ මුදල)
        const houseProfit = totalBetAmount - totalPayoutAmount;

        return res.json({
            success: true,
            stats: {
                totalPlayers,
                platformLiability, // දැන් මෙතනට එන්නේ Odd/Even ආවත් වෙනස් නොවන ලයිව් රිස්ක් එකයි!
                totalBetsCount,
                houseProfit
            }
        });

    } catch (err) {
        console.error("Admin Stats Error:", err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 👥 2. GET ALL PLAYERS LIST
// 🔒 ඇඩ්මින්ට විතරයි මුළු ප්ලේයර්ස්ලාගේ ලිස්ට් එකම බලන්න පුළුවන්
router.get('/users', protect, adminOnly, async (req, res) => {
    try {
        // ඇඩ්මින්ලා නැතුව සාමාන්‍ය යූසර්ස්ලා ඔක්කොම ගන්නවා (මුරපද නැතුව)
        const players = await User.find({ role: 'user' })
                                  .select('-password')
                                  .sort({ createdAt: -1 });
        
        return res.json({ success: true, players });
    } catch (err) {
        console.error("Get Players Error:", err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 💰 3. ADJUST PLAYER WALLET BALANCE (Manual Top-up / Deduction)
// 🔒 ඇඩ්මින්ට විතරයි ප්ලේයර් කෙනෙකුගේ සල්ලි මැනුවලි වෙනස් කරන්න පුළුවන්
router.put('/users/:id/balance', protect, adminOnly, async (req, res) => {
    try {
        const { amount, action } = req.body; // amount = සල්ලි ගණන, action = 'add' හෝ 'deduct'
        const userId = req.params.id;

        const player = await User.findById(userId);
        if (!player) {
            return res.status(404).json({ success: false, message: 'යූසර්ව සොයාගත නොහැක' });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: 'වලංගු මුදලක් ඇතුළත් කරන්න' });
        }

        // ඇඩ්මින් තෝරපු action එක අනුව බැලන්ස් එක වෙනස් කරනවා
        if (action === 'add') {
            player.balance += numericAmount;
        } else if (action === 'deduct') {
            if (player.balance < numericAmount) {
                return res.status(400).json({ success: false, message: 'ප්ලේයර් සතුව එතරම් මුදලක් නොමැත' });
            }
            player.balance -= numericAmount;
        } else {
            return res.status(400).json({ success: false, message: 'වැරදි ක්‍රියාවලියක් (Invalid Action)' });
        }

        await player.save();

        return res.json({ 
            success: true, 
            message: `ප්ලේයර්ගේ බැලන්ස් එක සාර්ථකව යාවත්කාලීන කරන ලදී`,
            updatedBalance: player.balance 
        });

    } catch (err) {
        console.error("Adjust Balance Error:", err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// 1. Pending deposits ලැයිස්තුව ගන්න
router.get('/deposits/pending', protect, adminOnly, adminController.getPendingDeposits);

// 2. Deposit එකක් approve/reject කරන්න
router.put('/deposits/:transactionId/action', protect, adminOnly, adminController.handleDepositAction);


// 🧪 ටෙස්ට් කරගන්න විතරක් තාවකාලිකව දාන Route එකක්
const Transaction = require('../models/Transaction');

router.post('/deposits/test-create', async (req, res) => {
    try {
        const { username, amount, slipUrl } = req.body;
        // ඩේටාබේස් එකේ ඉන්න පලවෙනි යූසර්ව හරි, නම මැච් වෙන යූසර්ව හරි ගන්නවා
        let user = await User.findOne({ username });
        if (!user) user = await User.findOne(); // යූසර් කෙනෙක් නැත්නම් ඉන්න පලවෙනි කෙනාව ගන්නවා
        
        if (!user) return res.status(404).json({ message: "No users found in database to link" });

        const newDeposit = new Transaction({
            userId: user._id,
            amount: amount,
            slipUrl: slipUrl,
            status: 'pending',
            type: 'deposit'
        });

        await newDeposit.save();
        res.status(201).json({ success: true, message: "Test Deposit Request Created!", data: newDeposit });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;