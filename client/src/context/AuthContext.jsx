import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token in cookies on load
        const token = Cookies.get('token');
        const userInfo = Cookies.get('userInfo');

        if (token && token !== 'undefined' && token !== 'null' && userInfo && userInfo !== 'undefined') {
            try {
                setUser(JSON.parse(userInfo));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                // If parsing fails, clear bad cookies
                Cookies.remove('token');
                Cookies.remove('userInfo');
            }
        } else {
            // Validate and clean just in case
            Cookies.remove('token');
            Cookies.remove('userInfo');
        }
        setLoading(false);
    }, []);

    // Axios Interceptor to handle expired/invalid tokens automatically
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    // Token expired or invalid
                    setUser(null);
                    Cookies.remove('token');
                    Cookies.remove('userInfo');
                    delete axios.defaults.headers.common['Authorization'];
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            const { token, ...userData } = res.data;

            setUser(userData);
            Cookies.set('token', token, { expires: 30 }); // 30 days
            Cookies.set('userInfo', JSON.stringify(userData), { expires: 30 });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
            const { token, ...userData } = res.data;

            setUser(userData);
            Cookies.set('token', token, { expires: 30 });
            Cookies.set('userInfo', JSON.stringify(userData), { expires: 30 });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('userInfo');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
