import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

let socket;

function Dashboard() {
    const [gameHistory, setGameHistory] = useState([]); // රවුන්ඩ් හිස්ට්‍රි එක තියාගන්න
    const [leaderboard, setLeaderboard] = useState([]); // 🔥 ලීඩර්බෝඩ් ස්ටේට් එක
    
    const { user, logout } = useContext(AuthContext);
    const [currentUser, setCurrentUser] = useState(user);
    const [timer, setTimer] = useState(30);
    const [diceResult, setDiceResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    
    // Betting States
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [betAmount, setBetAmount] = useState('');
    const [betMessage, setBetMessage] = useState({ type: '', text: '' });
    const [myCurrentBet, setMyCurrentBet] = useState(null);
    
    // Win / Loss Game Alert State
    const [gameAlert, setGameAlert] = useState({ show: false, isWin: false, message: '' });

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // 🔥 [FIXED]: socket එක initialize කරන ලයින් එක උඩට ගත්තා බග් නොවෙන්න
        socket = io('http://localhost:5000');

        // 🏆 ලයිව් ලීඩර්බෝඩ් අප්ඩේට් එක ඇල්ලීම
        // 🏆 ලයිව් ලීඩර්බෝඩ් අප්ඩේට් එක ඇල්ලීම
        socket.on('leaderboard_update', (data) => {
            // සර්වර් එකෙන් එන ටොප් 10 ලිස්ට් එක ස්ටේට් එකට දානවා
            setLeaderboard(data.topPlayers);
            
            // මුළු ලිස්ට් එකෙන්ම දැනට ලොග් වෙලා ඉන්න ඔයාගේ ඇත්තම Rank එක හොයාගන්නවා
            const myInfo = data.allRanks.find(p => p._id === user._id);
            if (myInfo) {
                // යූසර්ගේ ඔබ්ජෙක්ට් එකටම rank කියන එකත් එකතු කරලා ස්ටේට් එක අප්ඩේට් කරනවා
                setCurrentUser(prev => ({ ...prev, rank: myInfo.rank }));
            }
        });

        // 💻 සර්වර් සයිඩ් බෙටින් ලොක් එකෙන් එන මැසේජ් එක ඇල්ලීම
        socket.on('bet_error', (data) => {
            setBetMessage({ type: 'error', text: data.message });
            setMyCurrentBet(null); // හොරෙන් ගහන්න ගියපු බෙට් එකක් නම් UI එකෙන් රීසෙට් කරනවා
        });

        // ⏱️ ලයිව් ටයිමර් එක
        socket.on('timer', (data) => {
            setTimer(data.timer);
            
            // 🔥 [FIXED]: අලුත් රවුන්ඩ් එකක් ස්ටාර්ට් වෙද්දීම මැද තියෙන පරණ රිසල්ට් එක ක්ලියර් කරනවා!
            if (data.timer === 29) {
                setIsRolling(false);
                setDiceResult(null); // මැද කොටුව "Waiting" තත්වයට පත් කරනවා
                setMyCurrentBet(null);
                setBetMessage({ type: '', text: '' });
                setGameAlert({ show: false, isWin: false, message: '' }); 
            }
        });

        // 🎲 01. ටයිමර් එක 0 වුණ ගමන් සර්වර් එකෙන් ලයිව් රිසල්ට් එක එනවා
        socket.on('game_result', (data) => {
            setIsRolling(true);
            setDiceResult(null); 

            // ⏳ 02. ඇනිමේෂන් එක තත්පර 5ක් ප්ලේ වෙන්න දෙනවා
            setTimeout(() => {
                setIsRolling(false);
                setDiceResult(data.result); // දිනපු අංකය කොටුව මැද පෙන්වනවා
            }, 5000); 
        });

        // 📊 03. බෙට් කළත් නැතත් හැමෝගෙම RECENT හිස්ට්‍රි එක ලස්සනට අප්ඩේට් කරන ඉවෙන්ට් එක
        socket.on('round_ended_global', (data) => {
            setTimeout(() => {
                setGameHistory(prev => {
                    // 🔥 [FIXED]: දැන් බලන්නේ අංකය නෙවෙයි, රවුන්ඩ් අයිඩී එකයි. 
                    // ඒ නිසා එකම අංකය පිට පිට වැටුණත් හිස්ට්‍රි එකට ලස්සනට ඇඩ් වෙනවා!
                    if (prev.length > 0 && prev[0].roundId === data.roundId) {
                        return prev; 
                    }
                    
                    // හිස්ට්‍රි ඇරේ එක ඇතුළට අංකය විතරක් පුෂ් කරනවා
                    const updatedHistory = [data.winNumber, ...prev];
                    return updatedHistory.slice(0, 8); // අන්තිම රවුන්ඩ් 8 විතරක් තියාගන්නවා
                });
            }, 5500);
        });

        // 🔥 ලයිව් දිනුම්/පැරදුම් මැසේජ් එක ස්ක්‍රීන් එකට ගැනීම
        socket.on(`round_result_${user._id}`, (data) => {
            
            // ⏳ 04. අංකය වැටිලා මිලි තත්පර 500කින් මැසේජ් එක පෙන්වීම
            setTimeout(() => {
                const updatedUserData = { ...user, balance: data.newBalance };
                setCurrentUser(updatedUserData);
                localStorage.setItem('user', JSON.stringify(updatedUserData));

                if (data.isWin) {
                    setGameAlert({
                        show: true,
                        isWin: true,
                        message: `🥳 නියමයි මචන්! ඔයා දිනුවා! Rs.${data.prize}.00ක් එකතු වුණා!`
                    });
                } else {
                    setGameAlert({
                        show: true,
                        isWin: false,
                        message: `😭 අපරාදේ මචන්! ඔට්ටුව පැරදුනා. මීළඟ රවුන්ඩ් එක ට්‍රයි කරමු!`
                    });
                }
            }, 5500);

            // ⏳ 05. මැසේජ් එක තත්පර 3ක් පෙනී තිබී අයින් කිරීම
            setTimeout(() => {
                setGameAlert({ show: false, isWin: false, message: '' });
            }, 8500);
        });

        return () => {
            socket.disconnect();
            socket.off('timer');
            socket.off('bet_error');
            socket.off('game_result');
            socket.off('round_ended_global');
            socket.off('leaderboard_update');
            socket.off(`round_result_${user._id}`);
        };
    }, [user, navigate]);

    // 📊 [ADDED]: බෙට් හිස්ට්‍රි සඳහා ස්ටේට්ස් (ලයින් 143 ට උඩින් දාන්න)
const [betHistory, setBetHistory] = useState([]);
const [betSummary, setBetSummary] = useState({ totalBets: 0, winRate: "0.0%", netPNL: "Rs.0", isPositivePNL: true });
const [loadingHistory, setLoadingHistory] = useState(true);

// 🔄 API එකෙන් හිස්ට්‍රි ඩේටා ඇදලා ගන්නා ෆන්ක්ෂන් එක
const fetchBetHistory = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/bets/my-history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            setBetHistory(data.history);
            setBetSummary(data.summary);
        }
    } catch (error) {
        console.error("Error fetching bet history:", error);
    } finally {
        setLoadingHistory(false);
    }
};

// ⏱️ පේජ් එක ලෝඩ් වෙද්දී සහ ලයිව් අප්ඩේට් වෙද්දී රන් වෙන එක
useEffect(() => {
    fetchBetHistory();

    // බැක්එන්ඩ් එකෙන් සිග්නල් එක ආපු ගමන් හිස්ට්‍රි එක ලයිව් රීෆ්‍රෙෂ් කරනවා
    socket.on('history_updated', () => {
        fetchBetHistory();
    });

    return () => {
        socket.off('history_updated');
    };
}, []);

    // බෙට් එක දාන ෆන්ක්ෂන් එක
    const handlePlaceBet = (e) => {
        e.preventDefault();
        if (!selectedNumber) {
            setBetMessage({ type: 'error', text: 'කරුණාකර ඩයිස් අංකයක් තෝරන්න!' });
            return;
        }
        if (!betAmount || betAmount <= 0) {
            setBetMessage({ type: 'error', text: 'වලංගු මුදලක් ඇතුළත් කරන්න!' });
            return;
        }
        if (currentUser.balance < Number(betAmount)) {
            setBetMessage({ type: 'error', text: 'ඔට්ටුව තැබීමට ප්‍රමාණවත් මුදලක් නොමැත!' });
            return;
        }

        // 1. සර්වර් එකට ඩේටා යැවීම
        socket.emit('place_bet', {
            userId: currentUser._id,
            number: selectedNumber,
            amount: Number(betAmount)
        });

        // 🔥 [FIXED]: බෙට් එක දාපු සැනින් උඩ ප්‍රොෆයිල් බැලන්ස් එක අඩු කිරීම
        const calculatedBalance = currentUser.balance - Number(betAmount);
        const updatedUserData = { ...currentUser, balance: calculatedBalance };
        
        setCurrentUser(updatedUserData); // State එක අප්ඩේට් කරනවා (උඩ Wallet UI එක මාරු වෙනවා)
        localStorage.setItem('user', JSON.stringify(updatedUserData)); // LocalStorage අප්ඩේට් කරනවා

        // 2. ඉතිරි ස්ටේට්ස් අප්ඩේට් කිරීම
        setMyCurrentBet({ number: selectedNumber, amount: betAmount });
        //setBetMessage({ type: 'success', text: `අංක ${selectedNumber} සඳහා Rs.${betAmount} ඔට්ටුව තැබුවා. 🎲` });
        setBetAmount('');
    };



    if (!user) return null;

    return (
        <div className="min-h-screen bg-cyberBg text-white font-sans">
            
            {/* 🔝 TOP NAVIGATION BAR */}
            <nav className="bg-cyberDark/80 backdrop-blur-md border-b border-cyberBlue/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyberBlue to-purple-500">
                        CYBET
                    </span>
                    <span className="bg-cyberBlue/10 border border-cyberBlue/30 text-cyberBlue text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                        Live Engine
                    </span>
                </div>
                
                <div className="flex items-center space-x-6">
                    <div className="bg-black/40 border border-cyberBlue/20 rounded-xl px-4 py-2 flex items-center space-x-3 shadow-[0_0_15px_rgba(0,210,255,0.05)]">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Your Wallet</p>
                            <p className="text-sm font-bold text-green-400">Rs. {currentUser.balance?.toLocaleString()}.00</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 font-bold">
                            $
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 border-l border-gray-800 pl-6">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-300">{currentUser.name}</p>
                            <p className="text-[10px] text-cyberBlue uppercase tracking-wider">{currentUser.role}</p>
                        </div>
                        <button onClick={logout} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* 🎮 MAIN ARENA CONTENT */}
            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                
                <div className="md:col-span-2 flex flex-col gap-4">
                    {/* LEFT: LIVE DICE MAT */}
                <div className="md:col-span-2 bg-cyberDark border border-cyberBlue/10 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(0,210,255,0.02)] h-[400px]">
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Live Match Arena</span>
                        </div>
                        
                        {/* 📊 RECENT ROUNDS UI */}
                        <div className="flex items-center space-x-2 bg-slate-900/50 px-2 py-1 rounded border border-gray-800/40">
                            <span className="text-[9px] text-gray-500 font-black tracking-wider">RECENT:</span>
                            <div className="flex space-x-1.5">
                                {gameHistory.map((num, index) => (
                                    <span 
                                        key={`${index}-${num}`}
                                        className={`w-5 h-5 flex items-center justify-center text-[11px] font-black rounded border transition-all duration-300 ${
                                            index === 0 
                                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse' 
                                                : 'bg-slate-800/80 text-gray-400 border-slate-700/60'
                                        }`}
                                    >
                                        {num}
                                    </span>
                                ))}
                                {gameHistory.length === 0 && (
                                    <span className="text-[10px] text-gray-600 italic">No records</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LIVE TIMER */}
                    <div className="text-center mb-8">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Next Roll In</p>
                        <h2 className={`text-6xl font-black tracking-tighter transition-all ${timer <= 5 ? 'text-red-500 scale-110 animate-pulse' : 'text-cyberBlue'}`}>
                            {timer}<span className="text-xl font-normal text-gray-600">s</span>
                        </h2>
                    </div>

                    {/* CYBER DICE BOX */}
                    <div className="w-32 h-32 bg-black/50 border-2 border-cyberBlue/30 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(0,210,255,0.1)] mb-6">
                        {isRolling ? (
                            <span className="text-4xl text-cyberBlue animate-spin">🌀</span>
                        ) : diceResult ? (
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyberBlue drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">
                                {diceResult}
                            </span>
                        ) : (
                            <span className="text-gray-600 text-sm font-medium uppercase tracking-wider text-center p-2">Waiting</span>
                        )}
                    </div>

                    {myCurrentBet && (
                        <div className="bg-cyberBlue/5 border border-cyberBlue/20 rounded-xl px-4 py-2 text-xs text-center text-gray-300 mb-4">
                            ඔබේ ඔට්ටුව: <span className="text-cyberBlue font-bold">අංක {myCurrentBet.number}</span> සඳහා <span className="text-green-400 font-bold">Rs.{myCurrentBet.amount}</span>
                        </div>
                    )}

                    {/* 🔥 LIVE WIN / LOSS POPUP ALERT */}
                    {gameAlert.show && (
                        <div className={`w-full max-w-md p-4 rounded-xl border text-sm font-bold text-center animate-bounce transition-all ${
                            gameAlert.isWin 
                            ? 'bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                            : 'bg-red-500/20 border-red-500 text-red-300'
                        }`}>
                            {gameAlert.message}
                        </div>
                    )}
                </div>

                    {/* 📊 BET HISTORY & STATISTICS PANEL */}
<div className="bg-black/40 border border-cyberBlue/10 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,210,255,0.02)] flex flex-col h-[320px] w-full">
    
    {/* Panel Header */}
    <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
        <div className="flex items-center space-x-2">
            <span className="text-sm">📊</span>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                Bet History & Statistics
            </h4>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Live Updates</span>
    </div>

    {/* 🔥 QUICK STATS SUMMARY */}
    <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-black/20 border border-gray-850 p-2 rounded-lg text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total Bets</p>
            <p className="text-sm font-bold font-mono text-white mt-0.5">{betSummary.totalBets}</p>
        </div>
        <div className="bg-black/20 border border-gray-850 p-2 rounded-lg text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Win Rate</p>
            <p className="text-sm font-bold font-mono text-cyan-400 mt-0.5">{betSummary.winRate}</p>
        </div>
        <div className="bg-black/20 border border-gray-850 p-2 rounded-lg text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Net PNL</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${betSummary.isPositivePNL ? 'text-green-450' : 'text-red-400'}`}>
                {betSummary.netPNL}
            </p>
        </div>
    </div>

    {/* 🔥 DETAILED HISTORY TABLE (SCROLLABLE) */}
    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-xs">
        {loadingHistory ? (
            <p className="text-center text-gray-500 text-[11px] mt-10 animate-pulse font-mono">Loading history...</p>
        ) : betHistory.length === 0 ? (
            <p className="text-center text-gray-500 text-[11px] mt-10 font-mono">No bets placed yet.</p>
        ) : (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="pb-2 font-semibold">Dice</th>
                        <th className="pb-2 font-semibold">Amount</th>
                        <th className="pb-2 font-semibold">Result</th>
                        <th className="pb-2 font-semibold text-right">Payout</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-850/50 font-medium text-gray-300">
                    {betHistory.map((bet) => (
                        <tr key={bet._id}>
                            <td className="py-2.5">
                                <span className="bg-cyberBlue/10 border border-cyberBlue/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                                    #{bet.selectedNumber}
                                </span>
                            </td>
                            <td className="py-2.5 font-mono">Rs.{bet.amount.toLocaleString()}</td>
                            <td className="py-2.5">
                                {bet.status === 'WIN' ? (
                                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">WIN</span>
                                ) : bet.status === 'LOSS' ? (
                                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">LOSS</span>
                                ) : (
                                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">ROLLING</span>
                                )}
                            </td>
                            <td className={`py-2.5 text-right font-mono ${bet.status === 'WIN' ? 'text-green-450' : 'text-gray-500'}`}>
                                {bet.status === 'WIN' ? `+Rs.${bet.payout.toLocaleString()}` : 'Rs.0'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
</div>

                </div>

                {/* RIGHT: REAL-TIME BETTING PANEL */}
                <div className="bg-cyberDark border border-cyberBlue/10 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-800 pb-2">
                            Place Your Bet
                        </h3>

                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">1. Select Dice Number:</p>
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setSelectedNumber(num)}
                                    className={`h-12 rounded-xl border text-lg font-black transition-all duration-200 ${
                                        selectedNumber === num 
                                        ? 'bg-gradient-to-br from-cyberBlue to-blue-600 border-cyberBlue text-black shadow-[0_0_15px_rgba(0,210,255,0.3)] scale-105' 
                                        : 'bg-black/30 border-gray-800 hover:border-gray-600 text-gray-400'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handlePlaceBet} className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">2. Enter Amount (Rs):</p>
                                <input 
                                    type="number"
                                    className="w-full bg-black/40 border border-gray-800 focus:border-cyberBlue rounded-xl px-4 py-3 text-white outline-none transition-all text-sm font-bold"
                                    placeholder="Ex: 500"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    disabled={timer <= 5}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={timer <= 5 || myCurrentBet || currentUser.balance <= 0}
                                className={`w-full font-bold py-3 rounded-xl transition-all ${
                                    timer <= 5 || myCurrentBet || currentUser.balance <= 0
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-300 hover:to-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                }`}
                            >
                                {timer <= 5 ? 'Betting Locked 🔒' : myCurrentBet ? 'Bet Placed ✓' : 'Place Bet'}
                            </button>
                        </form>

                        {betMessage.text && (
                            <div className={`mt-4 p-3 rounded-xl text-xs text-center border font-medium ${
                                betMessage.type === 'success' 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                                {betMessage.text}
                            </div>
                        )}
                    </div>
                    
                    {/* 🏆 REAL-TIME LEADERBOARD UI */}
                    <div className="my-5 bg-black/40 border border-cyberBlue/10 rounded-xl p-4 shadow-[0_0_15px_rgba(0,210,255,0.02)] flex flex-col max-h-[290px]">
                        <div className="flex items-center space-x-2 mb-3 border-b border-gray-850 pb-2">
                            <span className="text-sm">🏆</span>
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                                Top Whales (Leaderboard - Top 10)
                            </h4>
                        </div>
                        
                        {/* 🔥 SCROLLABLE CONTAINER: ප්ලේයර්ස්ලා 10 දෙනෙක් හිටියත් මැද විතරක් ස්ක්‍රෝල් වෙනවා */}
                        <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[170px] custom-scrollbar">
                            {leaderboard.map((player, idx) => (
                                <div 
                                    key={player._id} 
                                    className={`flex justify-between items-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                                        player._id === currentUser._id 
                                        ? 'bg-cyberBlue/10 border-cyberBlue/30 text-white shadow-[0_0_10px_rgba(0,210,255,0.1)]' 
                                        : 'bg-black/20 border-gray-850 text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                            idx === 0 ? 'bg-yellow-500 text-black font-extrabold animate-pulse' :
                                            idx === 1 ? 'bg-gray-300 text-black' :
                                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="truncate max-w-[90px]">{player.name}</span>
                                        {player._id === currentUser._id && (
                                            <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded uppercase font-bold">You</span>
                                        )}
                                    </div>
                                    <span className="font-mono text-green-450 text-[11px]">
                                        Rs.{player.balance?.toLocaleString()}.00
                                    </span>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <p className="text-[10px] text-gray-600 text-center italic py-1">Loading positions...</p>
                            )}
                        </div>

                        {/* 🔥 STICKY MY RANK BAR: යූසර් Top 10න් පිට ඉන්නවා නම් විතරක් පල්ලෙහායින් මේක ස්ටිකි වෙලා පේනවා */}
                        {currentUser.rank > 10 && (
                            <div className="mt-3 pt-2 border-t border-dashed border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-950/40 to-black/20 p-2 rounded-lg border border-purple-500/20">
                                <div className="flex items-center space-x-2 text-xs">
                                    <span className="text-purple-400 animate-pulse">🎯</span>
                                    <span className="text-gray-300">Your Position:</span>
                                    <span className="bg-purple-500/20 text-purple-300 font-black px-1.5 py-0.5 rounded text-[10px]">
                                        #{currentUser.rank}
                                    </span>
                                </div>
                                <span className="font-mono text-green-450 text-[11px] font-bold">
                                    Rs.{currentUser.balance?.toLocaleString()}.00
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="border border-dashed border-cyberBlue/20 bg-cyberBg/50 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-cyberBlue uppercase tracking-widest font-bold mb-0.5">System Status</p>
                        <p className="text-[11px] text-green-400 font-medium">Betting Engine Active 🔋</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;