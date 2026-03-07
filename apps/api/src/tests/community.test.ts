import { describe, it, expect } from 'vitest';
import app from '../combo-server.js';

describe('Community API', () => {
  it('GET /api/v1/community/stats returns stats', async () => {
    const res = await app.request('/api/v1/community/stats');
    const data = await res.json() as {totalMembers:number};
    expect(res.status).toBe(200);
    expect(typeof data.totalMembers).toBe('number');
  });

  it('GET /api/v1/community/feed returns events', async () => {
    const res = await app.request('/api/v1/community/feed');
    const data = await res.json() as {events:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.events)).toBe(true);
  });
});
