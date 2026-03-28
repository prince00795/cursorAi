import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('kisan_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(phone, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('kisan_token', token);
      localStorage.setItem('kisan_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(name, phone, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('kisan_token', token);
      localStorage.setItem('kisan_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kisan_token');
    localStorage.removeItem('kisan_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return { user, loading, error, login, register, logout, isAdmin, isAuthenticated };
}
