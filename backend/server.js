const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Bet = require('./models/Bet');
const User = require('./models/User'); 

const app = express();

// 🌐 Express Middlewares
app.use(cors());
app.use(express.json());

// 📁 රවුට් ෆයිල් ලින්ක් කිරීම
const betRoutes = require('./routes/bet'); 
app.use('/api/bets', betRoutes);   

const adminRoutes = require('./routes/admin'); 
app.use('/api/admin', adminRoutes);    

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// 📊 LEADERBOARD CALCULATION FUNCTION
const emitLeaderboard = async () => {
    try {
        const allPlayers = await User.find({}, 'name username balance role').sort({ balance: -1 });

        const rankedPlayers = allPlayers.map((player, index) => ({
            _id: player._id,
            name: player.name,
            username: player.username,
            balance: player.balance,
            role: player.role,
            rank: index + 1 
        }));

        const top10Players = rankedPlayers.slice(0, 10);

        const sockets = await io.fetchSockets();
        for (let socket of sockets) {
            socket.emit('leaderboard_update', {
                topPlayers: top10Players,
                allRanks: rankedPlayers 
            });
        }
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
    }
};

// 🗄️ MONGODB CONNECTION
const dbURI = "mongodb+srv://cybetapp_db_user:Tz7GYw8UGFkX4UO0@cluster0.dz0c9df.mongodb.net/Cybet?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => {
        console.log('MongoDB Atlas Connected Successfully! ☁️');
        emitLeaderboard();
    })
    .catch(err => console.log('MongoDB Atlas Connection Error:', err));


// 🔐 AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'මෙම Username එක දැනටමත් භාවිතයේ ඇත.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashedPassword });
        await newUser.save();

        emitLeaderboard();

        const token = jwt.sign({ id: newUser._id }, 'CYBER_SECRET_KEY', { expiresIn: '1d' });
        return res.json({ success: true, token, user: newUser });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ success: false, message: 'Username හෝ Password වැරදියි.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Username හෝ Password වැරදියි.' });
        
        emitLeaderboard();

        const token = jwt.sign({ id: user._id }, 'CYBER_SECRET_KEY', { expiresIn: '1d' });
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


// 🎮 GAME ENGINE (DYNAMIC DICE ROLLING SYSTEM)
let timer = 30;
let currentResult = null;
let isRoundProcessing = false; 

setInterval(async () => {
    if (timer > 0) {
        timer--;
        io.emit('timer', { timer });
    } 
    else if (timer === 0 && !isRoundProcessing) {
        isRoundProcessing = true; 

        currentResult = Math.floor(Math.random() * 6) + 1;
        io.emit('game_result', { result: currentResult });

        try {
            const usersWithBets = await User.find({ 'currentBet.amount': { $gt: 0 } });

            for (let user of usersWithBets) {
                let isWin = false;
                let prize = 0;
                let status = 'LOSS'; 

                // 🎯 Dynamic Win Condition Logic
                // දැනට default බෙට් ටයිප් එක NUMBER (අංක 1-6) නිසා කෙලින්ම මැච් කරනවා.
                // පස්සේ කාලෙක 'ODD' හෝ 'EVEN' ආවොත් මෙතනට තව 'else if' කෑල්ලක් දාන්න විතරයි තියෙන්නේ.
                const currentBetType = user.currentBet.betType || 'NUMBER';
                
                if (currentBetType === 'NUMBER' && user.currentBet.number === currentResult) {
                    isWin = true;
                } else if (currentBetType === 'EVEN' && currentResult % 2 === 0) {
                    isWin = true;
                } else if (currentBetType === 'ODD' && currentResult % 2 !== 0) {
                    isWin = true;
                }

                if (isWin) {
                    // 🔥 හාඩ්කෝඩ් නොකර, ඔට්ටුව දාද්දීම හැදුණු potentialPayout එක කෙලින්ම දිනපු කෙනාට දෙනවා
                    // (Fallback එකක් විදිහට පරණ ඩේටා වල potentialPayout නැති නිසා මුදල 2න් ගුණ කරනවා)
                    prize = user.currentBet.potentialPayout || (user.currentBet.amount * 2);
                    user.balance += prize;
                    status = 'WIN'; 
                }

                // 📝 බෙට් හිස්ට්‍රි එක ඩේටාබේස් එකට දමමු (අලුත් ෆීල්ඩ්ස් ද සමග)
                await Bet.create({
                    userId: user._id,
                    selectedNumber: user.currentBet.number,
                    amount: user.currentBet.amount,
                    diceResult: currentResult,
                    status: status,
                    payout: prize,
                    betType: currentBetType, // පස්සේ කාලෙක ඇඩ්මින් පැනල් එකේ ඇනලිටික්ස් බලන්න ලේසියි
                    multiplier: user.currentBet.multiplier || 2
                });

                io.emit(`round_result_${user._id}`, {
                    isWin,
                    prize,
                    diceResult: currentResult,
                    winNumber: currentResult, 
                    currentBetNumber: user.currentBet.number,
                    betAmount: user.currentBet.amount,
                    newBalance: user.balance
                });

                // 🔄 රවුන්ඩ් එක ඉවර නිසා බෙට් එක ක්ලියර් කිරීම
                user.currentBet.number = null;
                user.currentBet.amount = 0;
                user.currentBet.multiplier = null;
                user.currentBet.potentialPayout = null;
                user.currentBet.betType = null;
                
                await user.save();
            }

            io.emit('round_ended_global', { 
                winNumber: currentResult,
                roundId: Date.now() 
            });
            io.emit('balance_updated');
            
            emitLeaderboard();
            io.emit('history_updated');

        } catch (err) {
            console.error("Bet calculation error:", err);
        }

        setTimeout(() => {
            timer = 30;
            isRoundProcessing = false; 
        }, 10000);
    }
}, 1000);


// 🔌 SOCKET.IO CONNECTIONS
io.on('connection', (socket) => {
    emitLeaderboard();

    socket.on('place_bet', async (data) => {
        const { userId, number, amount, betType } = data; // betType: 'NUMBER', 'EVEN', 'ODD' වගේ එවන්න පුළුවන්
        try {
            const user = await User.findById(userId);
            
            if (!user) return;
            if (user.balance < amount) {
                socket.emit('bet_error', { message: 'ඔබ සතුව ප්‍රමාණවත් මුදලක් නොමැත!' });
                return;
            }

            // --- [DYNAMIC MULTIPLIER LOGIC] ---
            let currentMultiplier = 2; // Default 1-6 අංක වලට 2x දෙනවා
            let assignedBetType = betType || 'NUMBER';

            if (assignedBetType === 'EVEN' || assignedBetType === 'ODD') {
                currentMultiplier = 1.9; // උදාහරණයක් විදිහට ඔත්තේ/ඉරට්ටේ වලට 1.9x දෙනවා නම්
            } else if (assignedBetType === 'SPECIAL_NUMBER') {
                currentMultiplier = 5; 
            }
            
            const potentialPayout = Number(amount) * currentMultiplier;
            // ----------------------------------

            user.balance -= Number(amount);
            user.currentBet.number = number !== undefined ? Number(number) : null; // Odd/Even වලදී number එකක් ඕන වෙන්නේ නෑ
            user.currentBet.amount = Number(amount);
            
            // 🔥 අනාගතය සඳහා ස්කීමා එකට සේව් වන කෑලි ටික
            user.currentBet.betType = assignedBetType;
            user.currentBet.multiplier = currentMultiplier; 
            user.currentBet.potentialPayout = potentialPayout; 
            
            await user.save();
            
            emitLeaderboard();
            socket.emit('bet_success', { message: 'ඔට්ටුව සාර්ථකයි!', updatedUser: user });
        } catch (err) {
            console.error("Place Bet Socket Error:", err);
            socket.emit('bet_error', { message: 'Server Error. කරුණාකර නැවත උත්සාහ කරන්න.' });
        }
    });
});


// 🚀 SERVER LISTEN
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Cybet Backend Server running on port ${PORT} 🚀`);
});