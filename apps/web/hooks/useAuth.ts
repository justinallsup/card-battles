'use client';
import { useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../lib/api';
import { clearTokens, setTokens, getToken } from '../lib/api';
import type { User } from '@card-battles/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    clearTokens();
    setUser(null);
  }, []);

  return { user, loading, setUser, logout };
}
