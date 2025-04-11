import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

// Create the authentication context
const AuthContext = createContext(null);

// Authentication provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Verify the token and get user data
          const response = await authApi.getCurrentUser();
          setUser(response.data);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        // Clear invalid token
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(credentials);
      const { user, token } = response.data;
      
      // Save token to local storage
      localStorage.setItem('auth_token', token);
      
      // Set user in state
      setUser(user);
      
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register(userData);
      const { user, token } = response.data;
      
      // Save token to local storage
      localStorage.setItem('auth_token', token);
      
      // Set user in state
      setUser(user);
      
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API if needed
      await authApi.logout();
      
      // Clear token from local storage
      localStorage.removeItem('auth_token');
      
      // Clear user from state
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.updateProfile(profileData);
      
      // Update user in state
      setUser(response.data);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
