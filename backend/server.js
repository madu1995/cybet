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
app.use(express.json()); // JSON data බාරගන්න

// Base/Ping Route (Cold start එක චෙක් කරන්න සහ Vercel එකට ඕන වෙනවා)
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