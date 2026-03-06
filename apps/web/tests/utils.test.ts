import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatTimeLeft } from '../lib/utils';

describe('utils', () => {
  it('formats numbers', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500000)).toBe('1.5M');
  });

  it('formats percent', () => {
    expect(formatPercent(62.4)).toBe('62%');
    expect(formatPercent(100)).toBe('100%');
  });

  it('formats time left for ended battles', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(formatTimeLeft(past)).toBe('Ended');
  });

  it('formats time left in hours', () => {
    const future = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
    expect(formatTimeLeft(future)).toMatch(/h/);
  });
});
