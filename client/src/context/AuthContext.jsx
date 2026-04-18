import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Set up axios base
const api = axios.create({ baseURL: '/api' });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const stored = localStorage.getItem('cc_user');

    if (token && stored) {
      // Immediately restore from localStorage so the UI doesn't flash blank
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token with backend in background — update user data if server is up
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('cc_user', JSON.stringify({ ...data, token }));
        })
        .catch(() => {
          // Token is invalid / expired — clear session
          // But only clear if we get a 401, not a network error
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // data = { _id, name, email, role, avatar, healthScore, token }
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? '⚠️ Cannot reach server. Make sure the backend is running on port 5000.'
          : 'Login failed. Please try again.');
      throw new Error(msg);
    }
  };

  /**
   * REGISTER — calls POST /api/auth/register
   * The backend hashes the password and saves to MongoDB automatically.
   * Returns the new user object + JWT on success.
   */
  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      // data = { _id, name, email, role, avatar, healthScore, token }
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? '⚠️ Cannot reach server. Make sure the backend is running on port 5000.'
          : 'Registration failed. Please try again.');
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { api };
