import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { endpoints } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    endpoints
      .me()
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('vms_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await endpoints.login(email, password);
    localStorage.setItem('vms_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vms_token');
    setUser(null);
  };

  const refreshUser = () =>
    endpoints
      .me()
      .then((d) => {
        setUser(d.user);
        return d.user;
      })
      .catch(() => null);

  // Cek hak fitur user yang sedang login (diatur di halaman Manajemen Fitur).
  const can = useCallback((key) => !!user?.features?.[key], [user]);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, can, refreshUser, isAuth: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
