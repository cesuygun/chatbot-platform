import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { Ratelimit } from '@upstash/ratelimit';
import { vi } from 'vitest';

// Mock the Upstash Redis and Ratelimit
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn().mockReturnValue({
      // Mock Redis methods as needed
    }),
  },
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: vi.fn().mockReturnValue({
      limit: vi.fn(),
    }),
  },
}));

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows non-API routes to pass through', async () => {
    const request = new NextRequest(new Request('http://localhost:3000/dashboard'));
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('applies rate limiting to API routes', async () => {
    const request = new NextRequest(new Request('http://localhost:3000/api/chat'));
    request.headers.set('x-forwarded-for', '1.2.3.4');

    // Mock successful rate limit check
    (Ratelimit.slidingWindow as jest.Mock).mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 10000,
      }),
    });

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it('blocks requests when rate limit is exceeded', async () => {
    const request = new NextRequest(new Request('http://localhost:3000/api/chat'));
    request.headers.set('x-forwarded-for', '1.2.3.4');

    // Mock rate limit exceeded
    (Ratelimit.slidingWindow as jest.Mock).mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 10000,
      }),
    });

    const response = await middleware(request);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'Too many requests' });
  });

  it('uses default IP when x-forwarded-for is not present', async () => {
    const request = new NextRequest(new Request('http://localhost:3000/api/chat'));

    // Mock successful rate limit check
    (Ratelimit.slidingWindow as jest.Mock).mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 10000,
      }),
    });

    const response = await middleware(request);
    expect(response.status).toBe(200);
    expect(Ratelimit.slidingWindow).toHaveBeenCalled();
  });
});
