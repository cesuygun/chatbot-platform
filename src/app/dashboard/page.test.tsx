import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import React from 'react';
import { vi } from 'vitest';
import DashboardPage from './page';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { getSupabase } from '@/lib/supabase/client';

const mockUser = {
  id: 'test_user_id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    subscribed: true,
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmation_sent_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  is_anonymous: false,
  identities: [],
};

const mockBots = [
  {
    id: 'bot_1',
    name: 'SupportBot',
    user_id: 'test_user_id',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bot_2',
    name: 'SalesBot',
    user_id: 'test_user_id',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockUserProfile = {
  id: 'test_user_id',
  subscribed: true,
};

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
};

// Helper to create a properly structured mock Supabase client
const createMockSupabaseClient = ({
  user = mockUser,
  bots = mockBots,
  userProfile = mockUserProfile,
  authError = null,
}: {
  user?: typeof mockUser | null;
  bots?: typeof mockBots;
  userProfile?: typeof mockUserProfile;
  authError?: { message: string } | null;
} = {}) => {
  // Helper to return a chainable object ending with a promise
  const chainable = (finalValue: unknown, singleValue: unknown = null) => {
    const makePromise = () => {
      const promise: Promise<{ data: unknown; error: null }> = new Promise(resolve =>
        resolve({ data: finalValue, error: null })
      );
      (promise as unknown as { select: () => Promise<{ data: unknown; error: null }> }).select =
        () => makePromise();
      (promise as unknown as { eq: () => Promise<{ data: unknown; error: null }> }).eq = () =>
        makePromise();
      (promise as unknown as { order: () => Promise<{ data: unknown; error: null }> }).order = () =>
        makePromise();
      (promise as unknown as { limit: () => Promise<{ data: unknown; error: null }> }).limit = () =>
        makePromise();
      (promise as unknown as { insert: () => Promise<{ data: unknown; error: null }> }).insert =
        () => makePromise();
      (promise as unknown as { delete: () => Promise<{ data: unknown; error: null }> }).delete =
        () => makePromise();
      (promise as unknown as { single: () => Promise<{ data: unknown; error: null }> }).single =
        () => Promise.resolve({ data: singleValue ?? finalValue, error: null });
      return promise;
    };
    return makePromise();
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockImplementation(table => {
      if (table === 'bots') {
        return chainable([...bots], { ...bots[0] });
      } else if (table === 'users') {
        return chainable({ ...userProfile });
      }
      return chainable(null);
    }),
  };
};

// Mock the AuthProvider context
const mockAuthState = {
  user: mockUser as typeof mockUser | null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
};

const useAuthMock = () => mockAuthState;

vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(mockRouter);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'test_url';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_key';
  // Reset mock state
  mockAuthState.user = mockUser;
  mockAuthState.loading = false;
  mockAuthState.signIn.mockClear();
  mockAuthState.signUp.mockClear();
  mockAuthState.signOut.mockClear();
  mockAuthState.resetPassword.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

// Helper function to render with AuthProvider
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('DashboardPage', () => {
  it('renders dashboard with user information', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    // Wait for the dashboard to render
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    // Mock useAuth to return no user
    mockAuthState.user = null;
    mockAuthState.loading = false;
    renderWithAuth(<DashboardPage />);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('handles authentication error', async () => {
    // Mock useAuth to return no user
    mockAuthState.user = null;
    mockAuthState.loading = false;
    renderWithAuth(<DashboardPage />);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays loading state while fetching user data', async () => {
    // Mock useAuth to return loading state
    mockAuthState.user = mockUser;
    mockAuthState.loading = true;
    renderWithAuth(<DashboardPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders dashboard with user info, bots, and subscription', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it("displays list of user's bots", async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('SupportBot')).toBeInTheDocument();
      expect(screen.getByText('SalesBot')).toBeInTheDocument();
    });
  });

  it('creates a new bot', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Create New Bot')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/bot name/i);
    const createButton = screen.getByRole('button', { name: /create bot/i });

    await userEvent.type(nameInput, 'NewBot');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bots');
    });
  });

  it('deletes a bot', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('SupportBot')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bots');
    });
  });

  it('handles logout', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthState.signOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays subscription status correctly', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    renderWithAuth(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('shows subscription management button', async () => {
    // Mock useAuth to return user without subscription
    mockAuthState.user = {
      ...mockUser,
      user_metadata: {
        ...mockUser.user_metadata,
        subscribed: false,
      },
    };
    mockAuthState.loading = false;
    const mockSupabaseClient = createMockSupabaseClient({});
    (getSupabase as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );
    renderWithAuth(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });
  });
});
