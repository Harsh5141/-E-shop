import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const persistSession = (token, nextUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          clearSession();
          setLoading(false);
          return;
        }
      }

      try {
        const response = await api.get('/auth/me');
        persistSession(response.data.token, response.data.user);
      } catch (error) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const login = async (email, password, options = {}) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (options.adminOnly && user.role !== 'Admin') {
        toast.error('This login is only for admins.');
        return false;
      }

      persistSession(token, user);
      
      toast.success(options.adminOnly ? 'Admin login successful!' : 'Login successful!');
      if (options.redirectTo) {
        navigate(options.redirectTo);
      } else if (user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      await api.post('/auth/register', { name, email, password });
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
      return true;
    } catch (error) {
      toast.error(error.response?.data || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    clearSession();
    toast.info('Logged out.');
    navigate('/login');
  };

  const updateUser = (changes) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const updatedUser = { ...currentUser, ...changes };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
