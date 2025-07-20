import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { apiConfig } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedGuestMode = localStorage.getItem('guestMode');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (savedGuestMode === 'true') {
      setIsGuest(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    if (!apiConfig.isDevelopment) {
      throw new Error('Authentication is only available in development mode. Please use Guest Mode to explore the interface.');
    }
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setIsGuest(false);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('guestMode');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (username: string, password: string) => {
    if (!apiConfig.isDevelopment) {
      throw new Error('Account creation is only available in development mode. Please use Guest Mode to explore the interface.');
    }
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setIsGuest(false);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('guestMode');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
    localStorage.setItem('guestMode', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestMode');
  };

  const value = {
    user,
    token,
    isGuest,
    login,
    signup,
    loginAsGuest,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}