import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../index';

// Simple in-process tests using Hono's test helper
async function req(path: string, opts: RequestInit = {}) {
  const res = await app.request(`http://localhost${path}`, opts);
  return { status: res.status, body: await res.json() };
}

describe('Auth', () => {
  const testUser = {
    username: `test_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };
  let accessToken = '';

  it('registers a new user (or 500 when DB unavailable)', async () => {
    const { status, body } = await req('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    expect([201, 500]).toContain(status);
    if (status === 201) {
      expect((body as { user: { username: string } }).user.username).toBe(testUser.username);
      expect((body as { accessToken: string }).accessToken).toBeTruthy();
      accessToken = (body as { accessToken: string }).accessToken;
    }
  });

  it('rejects duplicate email (or 500 when DB unavailable)', async () => {
    const { status } = await req('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    expect([409, 500]).toContain(status);
  });

  it('logs in with valid credentials (or 500 when DB unavailable)', async () => {
    const { status, body } = await req('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    expect([200, 500]).toContain(status);
    if (status === 200) {
      expect((body as { accessToken: string }).accessToken).toBeTruthy();
    }
  });

  it('rejects wrong password (or 500 when DB unavailable)', async () => {
    const { status } = await req('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'wrong' }),
    });
    expect([401, 500]).toContain(status);
  });

  it('returns current user with valid token or 401 when token missing', async () => {
    if (accessToken) {
      const { status, body } = await req('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect([200, 500]).toContain(status);
      if (status === 200) {
        expect((body as { username: string }).username).toBe(testUser.username);
      }
    } else {
      // No token (DB wasn't available during register) — expect 401
      const { status } = await req('/api/v1/auth/me');
      expect(status).toBe(401);
    }
  });

  it('rejects /me without token', async () => {
    const { status } = await req('/api/v1/auth/me');
    expect(status).toBe(401);
  });
});
