const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. සාමාන්‍ය ලොග් වුණු යූසර් කෙනෙක්ද කියා චෙක් කරන ගේට්ටුව
const protect = async (req, res, next) => {
    let token;

    // Request Headers වල Authorization එකේ Bearer Token එකක් තියෙනවාද බලනවා
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // "Bearer eyJhbGciOi..." කෑල්ලෙන් Token එක විතරක් කඩලා ගන්නවා
            token = req.headers.authorization.split(' ')[1];

            // Token එක Decode කරලා බලනවා (Valid ද කියලා)
            const decoded = jwt.verify(token, 'CYBER_SECRET_KEY');

            // Token එක ඇතුළේ තියෙන User ID එකෙන් යූසර්ව සොයාගෙන, password එක නැතුව request එකට ඇඩ් කරනවා
            req.user = await User.findById(decoded.id).select('-password');

            next(); // හැමදේම හරිනම් ඊළඟ API ලොජික් එකට යන්න දෙනවා
        } catch (error) {
            return res.status(401).json({ success: false, message: 'ඇතුළු වීම තහනම්! වැරදි Token එකක්' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'ඇතුළු වීම තහනම්! Token එකක් නැත' });
    }
};

// 2. ඇඩ්මින්ට විතරක් ඇතුළු වෙන්න දෙන විශේෂ ගේට්ටුව
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // යූසර්ගේ රෝල් එක admin නම් විතරක් ඉස්සරහට යන්න දෙනවා
    } else {
        return res.status(403).json({ success: false, message: 'මෙය සිදු කිරීමට ඔබට බලය නැත (Admin Only)' });
    }
};

module.exports = { protect, adminOnly };