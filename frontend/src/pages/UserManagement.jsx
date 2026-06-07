import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [actionType, setActionType] = useState('add'); // 'add' or 'deduct'

    // 1. Fetch All Users from API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 2. Open Modal for specific user
    const openAdjustmentModal = (user) => {
        setSelectedUser(user);
        setAdjustmentAmount('');
        setActionType('add');
        setIsModalOpen(true);
    };

    // 3. Handle Balance Update API Request
    const handleBalanceUpdate = async (e) => {
        e.preventDefault();
        if (!adjustmentAmount || isNaN(adjustmentAmount)) return;

        try {
            const response = await axios.put(`/api/admin/users/${selectedUser._id}/balance`, {
                amount: parseFloat(adjustmentAmount),
                action: actionType
            });

            if (response.data.success) {
                // UI එක instant අප්ඩේට් කරන්න
                setUsers(users.map(u => 
                    u._id === selectedUser._id 
                        ? { ...u, balance: response.data.currentBalance } 
                        : u
                ));
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error updating balance:", error);
            alert("Failed to update balance");
        }
    };

    // Filter users based on search input
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col text-white">
            {/* Header Section */}
            {/* 🎛️ UPDATED HEADER SECTION (MATCHED WITH OVERVIEW DASHBOARD) */}
<div className="flex justify-between items-center mb-8 border-b border-gray-850 pb-4 flex-shrink-0">
    <div>
        {/* font-mono, text-xl සහ tracking-tight දාලා Overview එකටම මැච් කරා */}
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">User Management</h2>
        {/* text-xs සහ text-gray-500 දාලා description එකත් එකම ලෙවල් එකට ගත්තා */}
        <p className="text-xs text-gray-500 mt-1">Manage registered players and adjust financial wallets</p>
    </div>
    
    {/* Search Bar එකත් Dashboard තීම් එකට ගැලපෙන්න පොඩ්ඩක් update කරා */}
    <input
        type="text"
        placeholder="Search by username or email..."
        className="px-4 py-1.5 w-72 bg-black/20 border border-cyberBlue/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-all"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
</div>

            {/* Loading / Table State */}
            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading players data...</div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-[#0d1527] rounded-xl border border-slate-800 custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 bg-[#111a30] z-10 shadow-sm">
                            <tr className="border-b border-slate-800 bg-[#111a30] font-mono text-xs uppercase tracking-wider text-slate-400">
                                <th className="p-4">Username</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Total Bets</th>
                                <th className="p-4">Current Balance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs font-mono">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-[#14203e] transition">
                                        <td className="p-4 font-medium text-cyan-400">{user.username}</td>
                                        <td className="p-4 text-slate-300">{user.email}</td>
                                        <td className="p-4 font-mono">{user.totalBetsPlaced || 0}</td>
                                        <td className="p-4 font-mono text-emerald-400 font-semibold">
                                            Rs.{user.balance?.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => openAdjustmentModal(user)}
                                                className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-white rounded text-xs font-medium transition"
                                            >
                                                Adjust Balance
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No players found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Balance Adjustment Modal (Popup) */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                    <div className="bg-[#0d1527] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-lg font-bold mb-2">Adjust Wallet Balance</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Player: <span className="text-cyan-400 font-semibold">{selectedUser.username}</span> | Current: <span className="text-emerald-400">Rs.{selectedUser.balance}</span>
                        </p>
                        
                        <form onSubmit={handleBalanceUpdate}>
                            {/* Action Choice */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setActionType('add')}
                                    className={`py-2 text-sm font-medium rounded-lg border transition ${
                                        actionType === 'add' 
                                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                                >
                                    Add Funds (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionType('deduct')}
                                    className={`py-2 text-sm font-medium rounded-lg border transition ${
                                        actionType === 'deduct' 
                                            ? 'bg-rose-600 border-rose-500 text-white' 
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                                    }`}
                                >
                                    Deduct Funds (-)
                                </button>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-5">
                                <label className="block text-xs text-slate-400 mb-1">Amount (Rs.)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="Enter amount"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    className="w-full px-4 py-2 bg-[#070b19] border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 text-white font-mono text-sm"
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;