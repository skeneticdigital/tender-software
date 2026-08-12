import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tf_jwt_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.error('Failed to authenticate token:', err);
          localStorage.removeItem('tf_jwt_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto-login as Super Admin for smooth preview testing
        try {
          const res = await api.login('admin@tenderflow.com', 'admin123');
          localStorage.setItem('tf_jwt_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (e) {
          console.error('Auto login fallback failed:', e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('tf_jwt_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('tf_jwt_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      'Super Admin': 'admin@tenderflow.com',
      'Admin': 'admin@tenderflow.com',
      'Tender Manager': 'tender@tenderflow.com',
      'Project Manager': 'pm@tenderflow.com',
      'Site Supervisor': 'supervisor@tenderflow.com',
      'Accounts Manager': 'accounts@tenderflow.com',
      'Management / Viewer': 'mgmt@tenderflow.com'
    };

    const email = roleEmailMap[role] || 'admin@tenderflow.com';
    await login(email, 'admin123');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchRoleDemo, hasRole }}>
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
