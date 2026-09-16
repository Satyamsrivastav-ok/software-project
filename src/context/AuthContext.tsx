import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { User, DoctorProfile } from '../types';

interface AuthContextType {
  user: User | null;
  doctorProfile: DoctorProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>;
  refreshAuth: () => Promise<void>;
  quickLogin: (role: 'admin' | 'verified_doctor' | 'pending_doctor' | 'patient') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('docpulse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = async () => {
    const storedToken = localStorage.getItem('docpulse_token');
    if (!storedToken) {
      setUser(null);
      setDoctorProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setDoctorProfile(res.data.doctorProfile || null);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('docpulse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setDoctorProfile(res.data.doctorProfile || null);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        localStorage.setItem('docpulse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setDoctorProfile(res.data.doctorProfile || null);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const logout = () => {
    localStorage.removeItem('docpulse_token');
    setToken(null);
    setUser(null);
    setDoctorProfile(null);
  };

  const updateProfile = async (data: any) => {
    try {
      const res = await api.put('/auth/profile', data);
      if (res.data.success) {
        setUser(res.data.user);
        if (res.data.doctorProfile) {
          setDoctorProfile(res.data.doctorProfile);
        }
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const quickLogin = async (role: 'admin' | 'verified_doctor' | 'pending_doctor' | 'patient') => {
    let email = '';
    let password = '';

    switch (role) {
      case 'admin':
        email = 'admin@docpulse.com';
        password = 'AdminPassword123!';
        break;
      case 'verified_doctor':
        email = 'dr.rahul@docpulse.com';
        password = 'DoctorPassword123!';
        break;
      case 'pending_doctor':
        email = 'dr.ananya@docpulse.com';
        password = 'DoctorPassword123!';
        break;
      case 'patient':
        email = 'patient.priya@docpulse.com';
        password = 'PatientPassword123!';
        break;
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctorProfile,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshAuth,
        quickLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
