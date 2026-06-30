import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthState {
  token: string | null;
  user: any;
  perms: string[];
  permsLoaded: boolean;
  login: (newToken: string, newUser: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<any>(
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')!)
      : null
  );
  const [perms, setPerms] = useState<string[]>([]);
  const [permsLoaded, setPermsLoaded] = useState(false);

  const login = useCallback(
    (newToken: string, newUser: any) => {
      localStorage.setItem('access_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      fetch('/api/auth/permissions', {
        headers: { Authorization: 'Bearer ' + newToken },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPerms(data);
            localStorage.setItem('permissions', JSON.stringify(data));
          }
        })
        .catch(() => {});
      setPermsLoaded(true);
      setToken(newToken);
      setUser(newUser);
      navigate('/dashboard');
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    setToken(null);
    setUser(null);
    setPerms([]);
    setPermsLoaded(false);
    navigate('/');
  }, [navigate]);

  // Global fetch interceptor for auth header
  useEffect(() => {
    const origFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers as Record<string, string>) || {};
      const storedToken = localStorage.getItem('access_token');
      if (storedToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${storedToken}`;
      }
      return origFetch(input, { ...init, headers });
    };
    return () => {
      window.fetch = origFetch;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, perms, permsLoaded, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
