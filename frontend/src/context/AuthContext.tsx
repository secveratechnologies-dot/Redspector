'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, companyName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.clear();
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.success && res.data) {
        const { accessToken, user: userData } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.push('/dashboard');
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, companyName: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, companyName, role: 'admin' })
      });
      if (res.success) {
        router.push('/login');
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
