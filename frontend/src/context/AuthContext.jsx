import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dms_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on load
  useEffect(() => {
    async function verifyUserSession() {
      const storedToken = localStorage.getItem('dms_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.response?.data?.message || err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    verifyUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: loggedInUser } = response.data;

      localStorage.setItem('dms_token', newToken);
      setToken(newToken);
      setUser(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: registeredUser } = response.data;

      localStorage.setItem('dms_token', newToken);
      setToken(newToken);
      setUser(registeredUser);

      return { success: true, user: registeredUser };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('dms_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'ADMIN') return true; // Superuser access
    return roles.map((r) => r.toUpperCase()).includes(userRole);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toUpperCase() === 'ADMIN',
    isManager: user?.role?.toUpperCase() === 'MANAGER',
    isViewer: user?.role?.toUpperCase() === 'VIEWER' || user?.role?.toUpperCase() === 'EMPLOYEE',
    login,
    register,
    logout,
    hasRole,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
