import { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '');

  const login = useCallback(async (email, password) => {
    const res = await loginApi(email, password);
    const { access_token } = res.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user_email', email);
    setToken(access_token);
    setUserEmail(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    setToken(null);
    setUserEmail('');
  }, []);

  return (
    <AuthContext.Provider value={{ token, userEmail, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
