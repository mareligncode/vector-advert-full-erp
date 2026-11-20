import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('vector_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('vector_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('vector_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('vector_user', JSON.stringify(res.data));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      const { token: receivedToken, ...userData } = res.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem('vector_token', receivedToken);
      localStorage.setItem('vector_user', JSON.stringify(userData));
    }
    return res;
  };

  const register = async (email, password, roles) => {
    const res = await authService.register(email, password, roles);
    if (res.success && res.data) {
      const { token: receivedToken, ...userData } = res.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem('vector_token', receivedToken);
      localStorage.setItem('vector_user', JSON.stringify(userData));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vector_token');
    localStorage.removeItem('vector_user');
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('vector_user', JSON.stringify(res.data));
      }
      return res;
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        forgotPassword: authService.forgotPassword,
        resetPassword: authService.resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
