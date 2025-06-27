import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import {
  AppRouterContext,
  AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mock Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: class {
    async get() { return null; }
    async set() { return 'OK'; }
    async incr() { return 1; }
    async del() { return 1; }
    async exists() { return 0; }
    async expire() { return 1; }
    async ttl() { return -1; }
  }
}));

// Mock Upstash Ratelimit
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    constructor() {
      return {
        limit: async () => ({ success: true, remaining: 10, reset: Date.now() + 60000 })
      };
    }
    static slidingWindow() { 
      return {
        limit: async () => ({ success: true, remaining: 10, reset: Date.now() + 60000 })
      }; 
    }
  }
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

// Set up MSW
const server = setupServer(
  http.post('/api/stripe/create-checkout-session', () => {
    return HttpResponse.json({ url: 'https://checkout.stripe.com/test' });
  }),
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ user: { id: 'test-user-id' } });
  }),
  http.post('/api/auth/register', () => {
    return HttpResponse.json({ user: { id: 'test-user-id' } });
  }),
  http.post('/api/chat', () => {
    return HttpResponse.json({ message: 'Test response' });
  }),
  http.get('http://localhost:54321/rest/v1/chatbots', ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    if (idParam === 'eq.test-bot-id') {
      return HttpResponse.json([{ id: 'test-bot-id', user_id: 'test-user-id' }]);
    }
    // Return empty for non-existent bot
    return HttpResponse.json([]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = IntersectionObserverMock;

// Mock window.scrollTo
window.scrollTo = vi.fn() as () => void;

// Mock window.HTMLElement.prototype.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    ...global.crypto,
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
  },
  writable: true,
});

// --- CRYPTO MOCKS ---
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {},
    writable: true,
  });
}
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = <T extends ArrayBufferView | null>(arr: T): T => {
    if (arr instanceof Uint8Array) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
    throw new Error('getRandomValues only supports Uint8Array');
  };
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => '123e4567-e89b-12d3-a456-426614174000';
}

// --- RADIX UI SELECT MOCK ---
vi.mock('@radix-ui/react-select', () => ({
  __esModule: true,
  Root: (props: { children?: React.ReactNode }) => (
    <div data-testid="radix-select-root">{props.children}</div>
  ),
  Group: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
  Value: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
  Trigger: (props: { children?: React.ReactNode }) => <button>{props.children}</button>,
  Content: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
  Item: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
  // Add other exports as needed
}));

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

export const AppRouterContextProviderMock = ({
  router,
  children,
}: {
  router: Partial<AppRouterInstance>;
  children: React.ReactNode;
}) => {
  const mockedRouter: AppRouterInstance = {
    back: vi.fn(),
    forward: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...router,
  };
  return <AppRouterContext.Provider value={mockedRouter}>{children}</AppRouterContext.Provider>;
};
