import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken } from '../api/axios';
import * as api from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const doLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  useEffect(() => {
    window.addEventListener('uf:unauthorized', doLogout);
    return () => window.removeEventListener('uf:unauthorized', doLogout);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('uf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .fetchMe()
      .then((me) => setUser(me))
      .catch(() => doLogout())
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email, password) => {
    const data = await api.login(email, password);
    setAuthToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const signOut = () => doLogout();

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'Admin',
    isStaff: user?.role === 'Admin' || user?.role === 'Accountant',
    isContact: user?.role === 'Contact',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);