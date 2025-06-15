import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
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
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

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
window.scrollTo = vi.fn();

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
