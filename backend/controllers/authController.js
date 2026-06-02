const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
    try {
        const { name, username, password } = req.body;

        // 1. හිස්තැන් තියෙනවාද බලන්න
        if (!name || !username || !password) {
            return res.status(400).json({ success: false, message: 'කරුණාකර සියලුම විස්තර ඇතුළත් කරන්න' });
        }

        // 2. දැනටමත් මේ username එකෙන් කෙනෙක් ඉන්නවාද බලන්න
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'මේ Username එක දැනටමත් පාවිච්චි කර ඇත' });
        }

        // 3. Password එක Hash (Encrypt) කිරීම
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. යූසර්ව ඩේටාබේස් එකේ සේව් කිරීම
        const user = await User.create({
            name,
            username,
            password: hashedPassword
            // balance එක default 0 වෙනවා, role එක default user වෙනවා
        });

        // 5. JWT Token එකක් සෑදීම
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d' // දින 30ක් යනකම් ලොගින් එක වැලිඩ්
        });

        res.status(201).json({
            success: true,
            message: 'ලියාපදිංචි වීම සාර්ථකයි!',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                balance: user.balance,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'කරුණාකර Username සහ Password ඇතුළත් කරන්න' });
        }

        // 1. යූසර් කෙනෙක් ඉන්නවාද බලන්න
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'වැරදි සාක්ෂි (Invalid credentials)' });
        }

        // 2. එකවුන්ට් එක ඇඩ්මින් බ්ලොක් (Freeze) කරලාද බලන්න
        if (user.isFrozen) {
            return res.status(403).json({ success: false, message: 'ඔබගේ ගිණුම තාවකාලිකව අත්හිටුවා ඇත. කරුණාකර ඇඩ්මින් අමතන්න.' });
        }

        // 3. පාස්වර්ඩ් එක මැච් වෙනවාද බලන්න (Bcrypt compare)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'වැරදි සාක්ෂි (Invalid credentials)' });
        }

        // 4. ලොගින් එක හරිනම් ආයෙත් අලුත් JWT Token එකක් දෙනවා
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Last Active දවස අප්ඩේට් කිරීම
        user.lastActive = Date.now();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'සාර්ථකව ලොග් වුණා!',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                balance: user.balance,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};