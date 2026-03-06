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

  it('registers a new user', async () => {
    const { status, body } = await req('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    expect(status).toBe(201);
    expect(body.user.username).toBe(testUser.username);
    expect(body.accessToken).toBeTruthy();
    accessToken = body.accessToken;
  });

  it('rejects duplicate email', async () => {
    const { status, body } = await req('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    expect(status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const { status, body } = await req('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    expect(status).toBe(200);
    expect(body.accessToken).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    const { status } = await req('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'wrong' }),
    });
    expect(status).toBe(401);
  });

  it('returns current user with valid token', async () => {
    const { status, body } = await req('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(200);
    expect(body.username).toBe(testUser.username);
  });

  it('rejects /me without token', async () => {
    const { status } = await req('/api/v1/auth/me');
    expect(status).toBe(401);
  });
});
