'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  inviteCode: string;
  coupleId?: string;
  profileImage?: string;
  birthday?: string;
}

interface CoupleInfo {
  id: string;
  startDate: string;
  coupleTitle: string;
  coverImage?: string;
}

interface PartnerInfo {
  id: string;
  nickname: string;
  profileImage?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  couple: CoupleInfo | null;
  partner: PartnerInfo | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [couple, setCouple] = useState<CoupleInfo | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const t = token || localStorage.getItem('token');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });
  }, [token]);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCouple(data.couple);
        setPartner(data.partner);
        setToken(t);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshUser();

    if (data.user.coupleId) {
      router.push('/dashboard');
    } else {
      router.push('/invite');
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    router.push('/invite');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCouple(null);
    setPartner(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, couple, partner, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
