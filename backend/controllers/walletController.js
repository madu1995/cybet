const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Admin adjusts user balance (Deposit/Deduct)
// @route   POST /api/wallet/adjust
// @access  Private/Admin
exports.adjustBalance = async (req, res) => {
    try {
        const { userId, amount, type, description } = req.body;

        if (!userId || amount === undefined || !type) {
            return res.status(400).json({ success: false, message: 'කරුණාකර සියලුම විස්තර ඇතුළත් කරන්න' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'යූසර්ව සොයාගත නොහැක' });
        }

        // ඇඩ්මින් සල්ලි එකතු කරනවාද, අඩු කරනවාද කියා බැලීම
        if (type === 'deposit') {
            user.balance += Number(amount);
        } else if (type === 'deduct') {
            if (user.balance < amount) {
                return res.status(400).json({ success: false, message: 'යූසර් සතුව ප්‍රමාණවත් බැලන්ස් එකක් නැත' });
            }
            user.balance -= Number(amount);
        } else {
            return res.status(400).json({ success: false, message: 'වැරදි ගනුදෙනු වර්ගයක් (Invalid type)' });
        }

        await user.save();

        // Transaction History එකට එකතු කිරීම
        await Transaction.create({
            user: user._id,
            type: type === 'deposit' ? 'deposit' : 'game_loss', // ඇඩ්මින් කැපුවොත් loss එකක් විදිහට දාන්න පුළුවන්
            amount: Number(amount),
            status: 'completed',
            description: description || `Balance adjusted by Admin (${req.user.name})`
        });

        res.status(200).json({
            success: true,
            message: 'බැලන්ස් එක සාර්ථකව අප්ඩේට් කළා!',
            userId: user._id,
            newBalance: user.balance
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    User requests a withdrawal
// @route   POST /api/wallet/withdraw-request
// @access  Private (Logged-in users)
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'කරුණාකර වලංගු මුදලක් ඇතුළත් කරන්න' });
        }

        const user = await User.findById(req.user.id);

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'ඔබගේ ගිණුමේ ප්‍රමාණවත් මුදලක් නැත' });
        }

        // ⚠️ වැදගත්ම ලොජික් එක: විඩ්‍රෝ රික්වෙස්ට් එක දාපු ගමන් යූසර්ගේ බැලන්ස් එකෙන් ඒ ගාන කැපෙනවා 
        // (එතකොට ඒ සල්ලි වලින් ආයෙත් බෙට් දාන්න බෑ)
        user.balance -= Number(amount);
        await user.save();

        // Transaction එක 'pending' ස්ටේටස් එකෙන් ක්‍රියේට් වෙනවා
        await Transaction.create({
            user: user._id,
            type: 'withdrawal_request',
            amount: Number(amount),
            status: 'pending',
            description: 'Withdrawal request submitted'
        });

        res.status(200).json({
            success: true,
            message: 'විඩ්‍රෝ රික්වෙස්ට් එක සාර්ථකව යොමු කළා. ඇඩ්මින් අනුමත කරන තෙක් ඉවසන්න.',
            newBalance: user.balance
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin approves/rejects withdrawal
// @route   PUT /api/wallet/withdraw-approve/:id
// @access  Private/Admin
exports.approveWithdrawal = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' හෝ 'reject'
        const transactionId = req.params.id;

        const tx = await Transaction.findById(transactionId);
        if (!tx || tx.type !== 'withdrawal_request' || tx.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'වලංගු නොවන හෝ දැනටමත් නිමකළ විඩ්‍රෝ රික්වෙස්ට් එකක්' });
        }

        const user = await User.findById(tx.user);

        if (action === 'approve') {
            // ඇඩ්මින් එපෘව් කළොත් ට්‍රාන්සැක්ෂන් එක completed වෙනවා (සල්ලි කලින්ම කැපිල තියෙන්නේ)
            tx.status = 'completed';
            tx.type = 'withdrawal_approved';
            tx.description = `Approved by Admin (${req.user.name})`;
            await tx.save();
        } else if (action === 'reject') {
            // ඇඩ්මින් රිජෙක්ට් කළොත් කැපුනු සල්ලි ටික ආයෙත් යූසර්ගේ එකවුන්ට් එකට රිෆන්ඩ් (Refund) වෙනවා!
            tx.status = 'failed';
            tx.description = `Rejected by Admin (${req.user.name})`;
            await tx.save();

            if (user) {
                user.balance += tx.amount;
                await user.save();
            }
        } else {
            return res.status(400).json({ success: false, message: 'වැරදි ක්‍රියාවක් (Invalid action)' });
        }

        res.status(200).json({
            success: true,
            message: `විඩ්‍රෝ එක සාර්ථකව ${action === 'approve' ? 'අනුමත කළා' : 'ප්‍රතික්ෂේප කළා'}`
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's transaction history (Withdrawal history)
// @route   GET /api/wallet/history
// @access  Private
exports.getTransactionHistory = async (req, res) => {
    try {
        // ලොග් වුණු යූසර්ට අදාළ හැම ට්‍රාන්සැක්ෂන් එකක්ම අලුත්ම ඒව ඉස්සරහට එන විදිහට (sort) ගන්නවා
        const history = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};