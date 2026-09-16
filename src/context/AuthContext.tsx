import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  canEdit: boolean;
  isProvider: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAuth = async () => {
    try {
      setLoading(true);
      const res = await api.checkAuth();
      if (res.success && res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, message: res.message || 'เข้าสู่ระบบสำเร็จ' };
      }
      return { success: false, message: res.message || 'เข้าสู่ระบบไม่สำเร็จ' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
    }
  };

  // Provider role is STRICTLY READ-ONLY
  const isProvider = user?.role === 'provider';
  const canEdit = !!user && !isProvider;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        canEdit,
        isProvider,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
