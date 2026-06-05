import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalPlayers: 0, platformLiability: 0, totalBetsCount: 0, houseProfit: 0 });
    const [loading, setLoading] = useState(true);
    
    // 🎛️ Active Tab එක track කරන්න අලුත් State එකක්
    const [activeTab, setActiveTab] = useState('overview'); 

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/admin/stats', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="h-screen bg-cyberBg text-white font-sans flex overflow-hidden">
            {/* 📟 SIDEBAR NAVIGATION */}
            <div className="w-64 h-full bg-bg-black/40 border-r border-cyberBlue/10 p-5 flex flex-col justify-between">
                <div>
                    <div className="mb-8">
                        <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono">
                            CYBET <span className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">ADMIN</span>
                        </h1>
                    </div>
                    
                    <nav className="space-y-2 text-sm font-medium">
                        {/* 📊 Overview Dashboard Button */}
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                                activeTab === 'overview' 
                                    ? 'bg-cyberBlue/10 border border-cyberBlue/30 text-cyan-400 font-semibold' 
                                    : 'text-gray-400 hover:text-white hover:bg-black/20 border border-transparent'
                            }`}
                        >
                            📊 Overview Dashboard
                        </button>

                        {/* 👥 User Management Button */}
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                                activeTab === 'users' 
                                    ? 'bg-cyberBlue/10 border border-cyberBlue/30 text-cyan-400 font-semibold' 
                                    : 'text-gray-400 hover:text-white hover:bg-black/20 border border-transparent'
                            }`}
                        >
                            👥 User Management
                        </button>

                        {/* 💰 Deposit Requests Button */}
                        <button 
                            onClick={() => setActiveTab('deposits')}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all ${
                                activeTab === 'deposits' 
                                    ? 'bg-cyberBlue/10 border border-cyberBlue/30 text-cyan-400 font-semibold' 
                                    : 'text-gray-400 hover:text-white hover:bg-black/20 border border-transparent'
                            }`}
                        >
                            💰 Deposit Requests
                        </button>
                    </nav>
                </div>

                <button onClick={handleLogout} className="w-full border border-red-500/20 hover:bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                    Logout Panel
                </button>
            </div>

            {/* 📈 MAIN CONTENT AREA */}
            <div className="flex-1 h-full flex flex-col p-8 overflow-hidden">
                
                {/* 1️⃣ TAB එක OVERVIEW නම් විතරක් මේ Header එකයි Cards ටිකයි පෙන්වන්න */}
                {activeTab === 'overview' && (
                    <>
                        <div className="flex justify-between items-center mb-8 border-b border-gray-850 pb-4">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-white font-mono">System Overview</h2>
                                <p className="text-xs text-gray-500 mt-1">Real-time site performance and global analytics</p>
                            </div>
                            <span className="text-xs text-cyan-400 font-mono bg-cyberBlue/5 border border-cyberBlue/10 px-3 py-1.5 rounded-full">Admin Session Active</span>
                        </div>

                        {loading ? (
                            <div className="text-center text-gray-500 text-xs font-mono mt-20 animate-pulse">Analyzing System Data...</div>
                        ) : (
                            /* 🔥 GRID STATS CARDS */
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Players</p>
                                    <p className="text-2xl font-black font-mono text-white mt-2">{stats.totalPlayers}</p>
                                </div>
                                <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Bets Placed</p>
                                    <p className="text-2xl font-black font-mono text-cyan-400 mt-2">{stats.totalBetsCount}</p>
                                </div>
                                <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Platform Liability</p>
                                    <p className="text-2xl font-black font-mono text-yellow-500 mt-2">Rs.{stats.platformLiability.toLocaleString()}</p>
                                </div>
                                <div className="bg-black/30 border border-gray-850 p-5 rounded-2xl">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Net House Profit</p>
                                    <p className={`text-2xl font-black font-mono mt-2 ${stats.houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.houseProfit >= 0 ? `+Rs.${stats.houseProfit.toLocaleString()}` : `-Rs.${Math.abs(stats.houseProfit).toLocaleString()}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 2️⃣ TAB එක USERS නම් USER MANAGEMENT COMPONENT එක ලෝඩ් කරන්න */}
                {activeTab === 'users' && <UserManagement />}

                {/* 3️⃣ TAB එක DEPOSITS නම් දැනට සාමාන්‍ය TEXT එකක් පෙන්වන්න (ඊළඟට මේක හදමු) */}
                {activeTab === 'deposits' && (
                    <div>
                        <div className="flex justify-between items-center mb-8 border-b border-gray-850 pb-4">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-white font-mono">Deposit Requests</h2>
                                <p className="text-xs text-gray-500 mt-1">Review and approve player deposit slips</p>
                            </div>
                        </div>
                        <div className="text-center text-gray-500 text-xs font-mono mt-20">Deposit Requests view is under construction...</div>
                    </div>
                )}
                
            </div>
        </div>
    );
};

export default AdminDashboard;