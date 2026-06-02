import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await register(name, username, password);
            if (data.success) {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'ලියාපදිංචි වීමට නොහැකි වුණා.');
        }
    };

    return (
        <div className="min-h-screen bg-cyberBg flex items-center justify-center p-5">
            <div className="bg-cyberDark border border-cyberBlue/20 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_30px_rgba(0,210,255,0.1)]">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyberBlue to-purple-500 text-center mb-6 tracking-wide">
                    CYBET REGISTER
                </h2>

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-cyberBlue uppercase tracking-wider block mb-1 font-medium">Your Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-gray-700 focus:border-cyberBlue rounded-xl px-4 py-3 text-white outline-none transition-all text-sm"
                            placeholder="Ex: John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-cyberBlue uppercase tracking-wider block mb-1 font-medium">Username</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-gray-700 focus:border-cyberBlue rounded-xl px-4 py-3 text-white outline-none transition-all text-sm"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-cyberBlue uppercase tracking-wider block mb-1 font-medium">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-black/40 border border-gray-700 focus:border-cyberBlue rounded-xl px-4 py-3 text-white outline-none transition-all text-sm"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-cyberBlue to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                        Create Account
                    </button>
                </form>

                <p className="text-center text-gray-500 text-xs mt-6">
                    දැනටමත් එකවුන්ට් එකක් තියෙනවාද? <Link to="/login" className="text-cyberBlue hover:underline">Log In වෙන්න</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;