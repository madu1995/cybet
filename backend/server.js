const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const initSocket = require('./config/socket');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// Base/Ping Route
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Cybet Game backend is running smoothly!' 
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`⚡ Server & Socket running on port ${PORT}`);
});