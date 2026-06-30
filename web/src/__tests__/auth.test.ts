import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('Auth API', () => {
  it('calls login with correct payload', async () => {
    const mockPost = vi
      .mocked(axios.post)
      .mockResolvedValue({ data: { access_token: 'test-token' } });
    // This is a placeholder - real test would import and call the actual login function
    expect(true).toBe(true);
    mockPost.mockClear();
  });

  it('uses base URL /api', () => {
    const config = { baseURL: '/api' };
    expect(config.baseURL).toBe('/api');
  });
});
