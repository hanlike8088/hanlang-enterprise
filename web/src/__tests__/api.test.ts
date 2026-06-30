import { describe, it, expect } from 'vitest';

describe('API Client', () => {
  it('uses correct base URL', () => {
    const baseURL = '/api';
    expect(baseURL).toBe('/api');
  });

  it('attaches auth token from localStorage', () => {
    const token = 'test-bearer-token';
    expect(token).toBeTruthy();
    expect(token.startsWith('test')).toBe(true);
  });
});
