import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 👈 රිෆ්‍රෙෂ් කරපු සැනින් user ස්ටේට් එක කෙලින්ම localStorage එකෙන් කියවලා initialize කරනවා.
    // එතකොට රිෆ්‍රෙෂ් වෙන තත්පරයට user = null වෙලා පේජ් එක ක්‍රෑෂ් වෙන්නේ හෝ ලොග් අවුට් වෙන්නේ නැහැ.
    const [user, setUser] = useState(() => {
    // 👈 'user' වෙනුවට 'userInfo' කියලා ලෝකල් ස්ටෝරේජ් එකේ තියෙන කී එක කියවන්න
    const savedUser = localStorage.getItem('userInfo') || localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
});
    
    // ටෝකන් එකත් ඒ විදිහටම එකපාර ගන්නවා
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // ඇක්සියෝස් Authorization හෙඩර් එක හැම රික්වෙස්ට් එකකටම සෙට් කරනවා
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // ලෝකල් ස්ටෝරේජ් එකේ යූසර් ඉන්නවා නම් ආයෙත් ස්ටේට් එකට කන්ෆර්ම් කරගන්නවා
            const savedUser = localStorage.getItem('userInfo') || localStorage.getItem('user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } else {
            // ටෝකන් එකක් නැත්නම් හෙඩර් එක අයින් කරනවා
            delete axios.defaults.headers.common['Authorization'];
        }
        
        // හැමදේම චෙක් කරලා ඉවර වුණාම loading එක සදහටම false කරනවා
        setLoading(false);
    }, [token]);

    // Login Function
    const login = async (username, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                
                setToken(res.data.token);
                setUser(res.data.user);
            }
            return res.data;
        } catch (error) {
            console.error("Login Error: ", error);
            return error.response?.data || { success: false, message: "Server Error" };
        }
    };

    // Register Function
    const register = async (name, username, password) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', { name, username, password });
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                
                setToken(res.data.token);
                setUser(res.data.user);
            }
            return res.data;
        } catch (error) {
            console.error("Register Error: ", error);
            return error.response?.data || { success: false, message: "Server Error" };
        }
    };

    // Logout Function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {/* loading එක true නම් ඇතුලේ තියෙන Routes (children) ලෝඩ් වෙන්න නොදී හෝල්ඩ් කරන් ඉන්නවා */}
            {!loading && children}
        </AuthContext.Provider>
    );
};