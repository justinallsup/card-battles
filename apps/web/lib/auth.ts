'use client';
import { auth as authApi, setTokens, clearTokens, getToken } from './api';
import type { User } from '@card-battles/types';

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await authApi.login({ email, password });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function registerUser(username: string, email: string, password: string): Promise<User> {
  const res = await authApi.register({ username, email, password });
  setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function logoutUser(): Promise<void> {
  try { await authApi.logout(); } catch {}
  clearTokens();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
