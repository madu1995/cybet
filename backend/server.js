const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

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

app.listen(PORT, () => {
    console.log(`⚡ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});