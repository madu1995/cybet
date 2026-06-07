const Transaction = require('../models/Transaction');
const User = require('../models/User');

// 1. Pending Deposit Requests ඔක්කොම ලෝඩ් කරගන්න
exports.getPendingDeposits = async (req, res) => {
    try {
        // User ගේ username එකත් එක්කම pending තියෙන deposit ටික විතරක් ගන්නවා
        const deposits = await Transaction.find({ type: 'deposit', status: 'pending' })
            .populate('userId', 'username email');
        
        res.status(200).json({ success: true, data: deposits });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Deposit එකක් Approve හෝ Reject කරන්න
exports.handleDepositAction = async (req, res) => {
    const { transactionId } = req.params;
    const { action } = req.body; // action එක 'approved' හෝ 'rejected' විය යුතුයි

    try {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        if (transaction.status !== 'pending') return res.status(400).json({ message: "Already processed" });

        if (action === 'approved') {
            // Player ව හොයලා balance එක එකතු කරනවා
            const user = await User.findById(transaction.userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            user.balance += transaction.amount;
            await user.save();

            transaction.status = 'approved';
        } else if (action === 'rejected') {
            transaction.status = 'rejected';
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await transaction.save();
        res.status(200).json({ success: true, message: `Deposit ${action} successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};