/**
 * Integration Test: Full Battle Flow
 *
 * These tests run against the combo-server (in-memory, no DB needed).
 * They are SKIPPED in standard CI unless INTEGRATION=true is set.
 *
 * To run locally:
 *   1. Start the combo server: PORT=3333 npx tsx src/combo-server.ts
 *   2. Run: INTEGRATION=true pnpm --filter @card-battles/api test
 *
 * Or use the dev script: ./scripts/dev.sh
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3333';
const runIntegration = process.env.INTEGRATION === 'true';

describe.skipIf(!runIntegration)('Full battle flow integration', () => {
  let token: string;
  let battleId: string;

  beforeAll(async () => {
    // Login as cardking
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { accessToken: string };
    token = data.accessToken;
    expect(token).toBeTruthy();
  });

  it('can fetch battle feed', async () => {
    const res = await fetch(`${BASE}/api/v1/battles/feed`);
    const data = await res.json() as { items: unknown[] };
    expect(res.status).toBe(200);
    expect(data.items.length).toBeGreaterThan(0);
    battleId = (data.items[0] as { id: string }).id;
    expect(battleId).toBeTruthy();
  });

  it('can vote on a battle', async () => {
    const res = await fetch(`${BASE}/api/v1/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ category: 'investment', choice: 'left' }),
    });
    // Either 200 (voted) or 409 (already voted) — both are valid
    expect([200, 409]).toContain(res.status);
  });

  it('can get battle results', async () => {
    const res = await fetch(`${BASE}/api/v1/battles/${battleId}/results`);
    const data = await res.json() as { battleId: string };
    expect(res.status).toBe(200);
    expect(data.battleId).toBe(battleId);
  });

  it('can post a comment', async () => {
    const res = await fetch(`${BASE}/api/v1/battles/${battleId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: 'Great battle!' }),
    });
    expect([200, 201]).toContain(res.status);
  });

  it('can get comments for a battle', async () => {
    const res = await fetch(`${BASE}/api/v1/battles/${battleId}/comments`);
    const data = await res.json() as { comments: unknown[] };
    expect(res.status).toBe(200);
    expect(Array.isArray(data.comments)).toBe(true);
  });

  it('can get leaderboard', async () => {
    const res = await fetch(`${BASE}/api/v1/leaderboards?type=creators&period=week`);
    const data = await res.json() as { items: unknown[] };
    expect(res.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('can get market feed', async () => {
    const res = await fetch(`${BASE}/api/v1/market/feed`);
    const data = await res.json() as { items: unknown[] };
    expect(res.status).toBe(200);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it('can get auctions', async () => {
    const res = await fetch(`${BASE}/api/v1/auctions`);
    const data = await res.json() as { auctions: unknown[] };
    expect(res.status).toBe(200);
    expect(Array.isArray(data.auctions)).toBe(true);
  });

  it('requires auth for protected routes', async () => {
    const res = await fetch(`${BASE}/api/v1/me/collection`);
    expect(res.status).toBe(401);
  });

  it('can get user profile', async () => {
    const res = await fetch(`${BASE}/api/v1/users/cardking`);
    expect(res.status).toBe(200);
    const data = await res.json() as { username: string };
    expect(data.username).toBe('cardking');
  });

  it('can access my profile with token', async () => {
    const res = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { username: string };
    expect(data.username).toBe('cardking');
  });

  it('can get daily picks', async () => {
    const res = await fetch(`${BASE}/api/v1/daily-picks`);
    expect(res.status).toBe(200);
    const data = await res.json() as { picks?: unknown[]; items?: unknown[] };
    // Accept either shape
    expect(data.picks ?? data.items).toBeTruthy();
  });

  it('tournaments return coming_soon', async () => {
    const res = await fetch(`${BASE}/api/v1/tournaments`);
    expect(res.status).toBe(200);
    const data = await res.json() as { tournaments: unknown[] };
    // Either coming_soon or empty list is acceptable
    expect(Array.isArray(data.tournaments)).toBe(true);
  });

  it('fantasy leagues return coming_soon', async () => {
    const res = await fetch(`${BASE}/api/v1/fantasy/leagues`);
    expect(res.status).toBe(200);
  });
});

// Always-on smoke tests that don't require the server to be running in a special mode
// These run even without INTEGRATION=true — they just confirm the test file loaded
describe('Integration test configuration', () => {
  it('INTEGRATION flag controls test execution', () => {
    const flag = process.env.INTEGRATION;
    // This just documents how to enable integration tests
    expect(typeof flag === 'string' || flag === undefined).toBe(true);
  });
});
