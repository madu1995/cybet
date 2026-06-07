import React, { useState, useEffect } from 'react';

const DepositRequests = () => {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null); // Modal එකේ පෙන්වන්න තෝරාගන්නා Slip එක
    const [actionLoading, setActionLoading] = useState(false);

    // 📡 Backend එකෙන් Pending Deposits ඇදලා ගැනීම
    const fetchPendingDeposits = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/deposits/pending', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setDeposits(data.data);
            }
        } catch (error) {
            console.error("Error fetching deposits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDeposits();
    }, []);

    // ⚡ Approve அல்லது Reject Action එක Handle කිරීම
    const handleAction = async (transactionId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this deposit request?`)) return;
        
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/deposits/${transactionId}/action`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action }) // 'approved' හෝ 'rejected'
            });

            const data = await response.json();
            if (data.success) {
                alert(`Request ${action} successfully!`);
                setSelectedSlip(null); // Modal එක open නම් වහන්න
                fetchPendingDeposits(); // Table එක Live Refresh කරන්න
            } else {
                alert(data.message || "Action failed");
            }
        } catch (error) {
            console.error("Error processing deposit action:", error);
            alert("Something went wrong!");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#070b19] text-white">
            
            {/* 🎛️ HEADER SECTION */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-850 pb-4 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white font-mono">Deposit Requests</h2>
                    <p className="text-xs text-gray-500 mt-1">Review and approve player bank deposit slips</p>
                </div>
                <span className="text-xs text-yellow-500 font-mono bg-yellow-500/5 border border-yellow-500/10 px-3 py-1.5 rounded-full animate-pulse">
                    {deposits.length} Pending Actions
                </span>
            </div>

            {/* 📊 DATA TABLE AREA */}
            {loading ? (
                <div className="text-center text-gray-500 text-xs font-mono mt-20 animate-pulse">Fetching Bank Slips...</div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-black/30 border border-gray-850 rounded-2xl">
                    <table className="w-full text-left border-collapse table-fixed font-mono text-xs">
                        <thead className="sticky top-0 bg-[#111a30] z-10 shadow-sm text-gray-400 uppercase tracking-wider border-b border-gray-850">
                            <tr>
                                <th className="p-4 w-1/4">Player (Username)</th>
                                <th className="p-4 w-1/4">Email</th>
                                <th className="p-4 w-1/5">Amount</th>
                                <th className="p-4 w-1/5">Receipt Slip</th>
                                <th className="p-4 text-center w-1/4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850/50">
                            {deposits.length > 0 ? (
                                deposits.map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-black/20 transition">
                                        <td className="p-4 font-bold text-white">
                                            {deposit.userId?.username || 'Unknown User'}
                                        </td>
                                        <td className="p-4 text-gray-400 truncate">
                                            {deposit.userId?.email || 'N/A'}
                                        </td>
                                        <td className="p-4 text-cyan-400 font-bold">
                                            Rs.{deposit.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            {/* Slip View Button */}
                                            <button 
                                                onClick={() => setSelectedSlip(deposit)}
                                                className="bg-cyberBlue/10 border border-cyberBlue/30 text-cyan-400 px-3 py-1 rounded-md hover:bg-cyan-500/20 transition"
                                            >
                                                🔍 View Slip
                                            </button>
                                        </td>
                                        <td className="p-4 text-center space-x-2 flex justify-center items-center">
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction(deposit._id, 'approved')}
                                                className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg font-bold hover:bg-green-500/20 transition"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction(deposit._id, 'rejected')}
                                                className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-lg font-bold hover:bg-red-500/20 transition"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-gray-600 font-mono">
                                        ☕ No pending deposit requests found.
                                    </td>
                                end</tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 🖼️ IMAGE PREVIEW MODAL (SLIP POPUP) */}
            {selectedSlip && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0d1527] border border-gray-850 rounded-2xl max-w-lg w-full p-6 flex flex-col relative">
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedSlip(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
                        >
                            ✕
                        </button>

                        <h3 className="text-sm font-bold font-mono text-white mb-2">
                            Deposit Slip - {selectedSlip.userId?.username}
                        </h3>
                        <p className="text-xs text-cyan-400 font-mono mb-4">
                            Requested Amount: Rs.{selectedSlip.amount.toLocaleString()}
                        </p>

                        {/* Slip Image Display */}
                        <div className="bg-black/40 border border-gray-850 rounded-xl p-2 flex justify-center items-center overflow-hidden max-h-[350px]">
                            <img 
                                src={selectedSlip.slipUrl.startsWith('http') ? selectedSlip.slipUrl : `http://localhost:5000/${selectedSlip.slipUrl}`} 
                                alt="Payment Receipt" 
                                className="object-contain max-h-[330px] rounded"
                                onError={(e) => { e.target.src = 'https://placehold.co/400x500?text=Slip+Image+Not+Found'; }}
                            />
                        </div>

                        {/* Modal Action Footer */}
                        <div className="flex justify-end space-x-2 mt-6 border-t border-gray-850 pt-4">
                            <button
                                disabled={actionLoading}
                                onClick={() => handleAction(selectedSlip._id, 'rejected')}
                                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-xl text-xs font-bold transition hover:bg-red-500/20"
                            >
                                Reject Request
                            </button>
                            <button
                                disabled={actionLoading}
                                onClick={() => handleAction(selectedSlip._id, 'approved')}
                                className="bg-green-500 border border-green-600 text-black px-4 py-1.5 rounded-xl text-xs font-bold transition hover:bg-green-400"
                            >
                                Approve & Credit
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DepositRequests;