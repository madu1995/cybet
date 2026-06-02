import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // මෙතනදී පස්සේ කාලෙක අපිට profile API එකක් ගහලා යූසර්ව අප්ඩේට් කරගන්න පුළුවන්
            setUser(JSON.parse(localStorage.getItem('user')));
        }
        setLoading(false);
    }, [token]);

    // Login Function
    const login = async (username, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setToken(res.data.token);
            setUser(res.data.user);
        }
        return res.data;
    };

    // Register Function
    const register = async (name, username, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/register', { name, username, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setToken(res.data.token);
            setUser(res.data.user);
        }
        return res.data;
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
            {children}
        </AuthContext.Provider>
    );
};