/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getSocket } from "../socket";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

axios.defaults.baseURL = process.env.REACT_APP_API || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(
    () => localStorage.getItem('token') || null
  );

  const applyToken = (t) => {
    if (t) {
      localStorage.setItem('token', t);
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      setToken(t);
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
    }
  };

  const loadUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        applyToken(null);
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    loadUser();
  }, []);

  // -------------------------
  // FRIEND PRESENCE REGISTER
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const registerPresence = () => {
      socket.emit("friend:register", { userId: user.id });
    };

    if (socket.connected) {
      registerPresence();
    } else {
      socket.once("connect", registerPresence);
    }

    return () => {
      socket.off("connect", registerPresence);
    };
  }, [user]);

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);

      const { token: newToken, user } = res.data;

      applyToken(newToken);
      setUser(user);

      return {
        success: true,
        user,
        token: newToken,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed',
      };
    }
  };
  
  const login = async (credentials) => {
    try {
      const res = await axios.post('/api/auth/login', credentials);

      const { token: newToken, user } = res.data;

      if (!newToken || !user) {
        throw new Error('Invalid login response');
      }

      applyToken(newToken);
      setUser(user);

      return {
        success: true,
        user,
        token: newToken,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    applyToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
