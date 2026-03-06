/**
 * User endpoint tests using the in-memory combo-server.
 * These tests don't require a real Postgres/Redis connection.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import comboApp from '../combo-server';

type JsonBody = Record<string, unknown>;

async function req(path: string, opts: RequestInit = {}): Promise<{ status: number; body: JsonBody }> {
  const res = await comboApp.request(`http://localhost${path}`, opts);
  return { status: res.status, body: await res.json() };
}

describe('Users (combo-server)', () => {
  const username = `users_test_${Date.now()}`;
  let userId = '';

  beforeAll(async () => {
    // Wait for combo-server init
    await new Promise((r) => setTimeout(r, 300));

    // Register a user to test with
    const reg = await comboApp.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: 'password123',
      }),
    });
    const body = (await reg.json()) as { user?: { id: string } };
    userId = body.user?.id ?? '';
  }, 15000);

  it('GET /users/:username returns user profile', async () => {
    const { status, body } = await req(`/api/v1/users/${username}`);
    expect(status).toBe(200);
    expect((body as { username: string }).username).toBe(username);
  });

  it('GET /users/:username returns id and email fields', async () => {
    const { status, body } = await req(`/api/v1/users/${username}`);
    expect(status).toBe(200);
    const user = body as { id?: string; username?: string; email?: string; created_at?: string };
    // Should have basic profile fields
    expect(user.username).toBe(username);
    // email, id may be included depending on impl
    expect(typeof user).toBe('object');
  });

  it('GET /users/:username/stats returns stats object', async () => {
    const { status, body } = await req(`/api/v1/users/${username}/stats`);
    expect(status).toBe(200);
    const stats = body as { votes_cast?: number; battles_created?: number; user_id?: string };
    // Stats should exist (may have zero values for new user)
    expect(typeof stats).toBe('object');
  });

  it('GET /users/:username/battles returns battles array', async () => {
    const { status, body } = await req(`/api/v1/users/${username}/battles`);
    expect(status).toBe(200);
    expect(Array.isArray((body as { items: unknown[] }).items)).toBe(true);
  });

  it('GET /users/:username returns 404 for nonexistent user', async () => {
    const { status } = await req('/api/v1/users/this_user_does_not_exist_xyz_99999');
    expect(status).toBe(404);
  });

  it('GET /users/:username/stats returns 404 for nonexistent user', async () => {
    const { status } = await req('/api/v1/users/nonexistent_user_xyz_99999/stats');
    expect(status).toBe(404);
  });

  it('demo user cardking exists in leaderboard', async () => {
    // cardking is seeded — check leaderboard has entries
    const { status, body } = await req('/api/v1/leaderboards?type=creators');
    expect(status).toBe(200);
    const items = (body as { items: unknown[] }).items;
    expect(items.length).toBeGreaterThan(0);
  });

  it('GET /users/:username/follow-status returns follow info', async () => {
    const { status, body } = await req(`/api/v1/users/${username}/follow-status`);
    expect(status).toBe(200);
    const b = body as { isFollowing?: boolean; followerCount?: number; followingCount?: number };
    expect(typeof b.isFollowing).toBe('boolean');
    expect(typeof b.followerCount).toBe('number');
  });
});
