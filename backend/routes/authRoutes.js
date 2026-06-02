const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Routes ටික Controller එකේ ලියපු Functions වලට සම්බන්ධ කිරීම
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;