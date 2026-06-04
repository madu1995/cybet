const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Bet = require('./models/Bet');
const User = require('./models/User'); // 👤 මෙතන විතරක් ඉම්පෝර්ට් එක තිබ්බාම ඇති!

const app = express();

// 🌐 Express Middlewares (CORS සහ JSON බොඩි පාසර් එක උඩින්ම තියමු)
app.use(cors());
app.use(express.json());

// 📁 රවුට් ෆයිල් එක ලින්ක් කිරීම සහ සම්බන්ධ කිරීම
const betRoutes = require('./routes/bet'); 
app.use('/api/bets', betRoutes);   

// 📁 Admin රවුට් ෆයිල් එක ලින්ක් කිරීම
const adminRoutes = require('./routes/admin'); 
app.use('/api/admin', adminRoutes); // 🌐 Admin API එක සම්බන්ධ කිරීම     

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// 📊 LEADERBOARD CALCULATION FUNCTION
// (සර්වර් එකට මුලින්ම පේන්න මේ ෆන්ක්ෂන් එක උඩින්ම ලිව්වා මචන්)
const emitLeaderboard = async () => {
    try {
        // 1. ඩේටාබේස් එකේ ඉන්න හැමෝම බැලන්ස් එක වැඩිම කෙනාගේ ඉඳන් සෝට් කරලා ගන්නවා
        const allPlayers = await User.find({}, 'name username balance role').sort({ balance: -1 });

        // 2. හැම ප්ලේයර් කෙනෙක්ටම Rank එකක් (1, 2, 3...) ඇතුළත් කරනවා
        const rankedPlayers = allPlayers.map((player, index) => ({
            _id: player._id,
            name: player.name,
            username: player.username,
            balance: player.balance,
            role: player.role,
            rank: index + 1 
        }));

        // 3. UI එකේ පෙන්වන්න Top 10 විතරක් කපා ගන්නවා
        const top10Players = rankedPlayers.slice(0, 10);

        // 4. හැම සොකට් කනෙක්ෂන් එකකටම වෙන වෙනම ඩේටා බ්‍රෝඩ්කාස්ට් කරනවා
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
        // 🔥 දැන් ෆන්ක්ෂන් එක උඩින් තියෙන නිසා මෙතනදී බය නැතුව රන් කරන්න පුළුවන්!
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


// 🎮 GAME ENGINE (DICE ROLLING SYSTEM)
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

                if (user.currentBet.number === currentResult) {
                    prize = user.currentBet.amount * 2;
                    user.balance += prize;
                    isWin = true;
                    status = 'WIN'; 
                }

                // 📝 බෙට් හිස්ට්‍රි එක ඩේටාබේස් එකට දමමු
                await Bet.create({
                    userId: user._id,
                    selectedNumber: user.currentBet.number,
                    amount: user.currentBet.amount,
                    diceResult: currentResult,
                    status: status,
                    payout: prize
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

                user.currentBet.number = null;
                user.currentBet.amount = 0;
                await user.save();
            }

            io.emit('round_ended_global', { 
                winNumber: currentResult,
                roundId: Date.now() 
            });
            io.emit('balance_updated');
            
            emitLeaderboard();

            // 🔄 ⚡ ලයිව් හිස්ට්‍රි අප්ඩේට් ට්‍රිගර් එක
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
        const { userId, number, amount } = data;
        try {
            const user = await User.findById(userId);
            
            if (timer <= 5) {
                socket.emit('bet_error', { message: 'කාලය අවසානයි! අවසන් තත්පර 5 තුළ ඔට්ටු තැබිය නොහැක. 🔒' });
                return;
            }

            if (!user || user.balance < amount) {
                socket.emit('bet_error', { message: 'ඔට්ටුව තැබීමට ප්‍රමාණවත් මුදලක් නොමැත හෝ ගිණුම අවලංගුයි.' });
                return;
            }

            user.balance -= amount;
            user.currentBet.number = Number(number);
            user.currentBet.amount = Number(amount);
            await user.save();

            emitLeaderboard();

            socket.emit('bet_success', { message: 'ඔට්ටුව සාර්ථකයි!', updatedUser: user });
        } catch (err) {
            console.error("Server Bet Error:", err);
            socket.emit('bet_error', { message: 'සර්වර් දෝෂයකි. නැවත උත්සාහ කරන්න.' });
        }
    });
});


// 🚀 SERVER LISTEN
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Cybet Backend Server running on port ${PORT} 🚀`);
});