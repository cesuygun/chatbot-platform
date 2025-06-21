import { middleware } from './middleware';
import { vi } from 'vitest';

// Mock the Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn().mockReturnValue({
      // Mock Redis methods as needed
    }),
  },
}));

// Mock the Ratelimit
vi.mock('@upstash/ratelimit', () => {
  const mockLimit = vi.fn();
  return {
    Ratelimit: class {
      static slidingWindow = (limit: number, window: string) => ({
        limit,
        window,
      });
      limit = mockLimit;
    },
  };
});

// Mock Supabase auth
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: vi.fn().mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  }),
}));

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows non-API routes to pass through', async () => {
    const response = await middleware();
    expect(response.status).toBe(200); // Dashboard is no longer protected by middleware
  });

  it.skip('applies rate limiting to API routes', async () => {
    // Mock successful rate limit check
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 10000,
    });

    // Update the mock implementation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Ratelimit = require('@upstash/ratelimit').Ratelimit;
    Ratelimit.prototype.limit = mockLimit;

    const response = await middleware();
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it.skip('blocks requests when rate limit is exceeded', async () => {
    // Mock rate limit exceeded
    const mockLimit = vi.fn().mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 10000,
    });

    // Update the mock implementation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Ratelimit = require('@upstash/ratelimit').Ratelimit;
    Ratelimit.prototype.limit = mockLimit;

    const response = await middleware();
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'Too many requests' });
  });

  it.skip('uses default IP when x-forwarded-for is not present', async () => {
    // Mock successful rate limit check
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 10000,
    });

    // Update the mock implementation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Ratelimit = require('@upstash/ratelimit').Ratelimit;
    Ratelimit.prototype.limit = mockLimit;

    const response = await middleware();
    expect(response.status).toBe(200);
    expect(mockLimit).toHaveBeenCalledWith('127.0.0.1');
  });
});
