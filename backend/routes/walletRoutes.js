const express = require('express');
const router = express.Router();
const { adjustBalance, requestWithdrawal, approveWithdrawal, getTransactionHistory } = require('../controllers/walletController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// 1. සාමාන්‍ย යූසර්ස්ලාට සහ ඇඩ්මින් දෙගොල්ලන්ටම පුළුවන් රවුට්ස් (ලොග් වෙලා ඉන්න ඕනේ)
router.post('/withdraw-request', protect, requestWithdrawal);
router.get('/history', protect, getTransactionHistory);

// 2. ඇඩ්මින්ට විතරක්ම සිද්ධ කරන්න පුළුවන් සුපිරි රවුට්ස් (protect සහ adminOnly දෙකම ඕනේ)
router.post('/adjust', protect, adminOnly, adjustBalance);
router.put('/withdraw-approve/:id', protect, adminOnly, approveWithdrawal);

module.exports = router;