import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import React from 'react';
import { vi } from 'vitest';
import DashboardPage from './page';
import { createBrowserClient } from '@supabase/ssr';

const mockUser = {
  id: 'test_user_id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
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

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
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
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockImplementation(table => {
      // For bots table
      if (table === 'bots') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: bots[0],
            error: null,
          }),
          then: vi.fn().mockImplementation(callback =>
            Promise.resolve().then(() =>
              callback({
                data: bots,
                error: null,
              })
            )
          ),
        };
      }
      // For users table
      else if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: userProfile,
            error: null,
          }),
        };
      }

      // Default return
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
    }),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(mockRouter);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'test_url';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_key';
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe('DashboardPage', () => {
  it('renders dashboard with user information', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    // First verify we see the loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Then wait for the dashboard to render
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('redirects to login if user is not authenticated', async () => {
    const mockSupabaseClient = createMockSupabaseClient({ user: null });
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('handles authentication error', async () => {
    const mockSupabaseClient = createMockSupabaseClient({
      user: null,
      authError: { message: 'Authentication error' },
    });
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays loading state while fetching user data', async () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockImplementation(
          () =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  data: { user: null },
                  error: null,
                });
              }, 100);
            })
        ),
      },
    };

    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders dashboard with user info, bots, and subscription', async () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(table => {
        if (table === 'bots') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockBots,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUserProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }),
    };

    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });
  });

  it("displays list of user's bots", async () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(table => {
        if (table === 'bots') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockBots,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUserProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }),
    };

    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(async () => {
      for (const bot of mockBots) {
        expect(await screen.findByText(bot.name)).toBeInTheDocument();
      }
    });
  });

  it('creates a new bot', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});

    // Add specific mocking for the bot creation path
    mockSupabaseClient.from = vi.fn().mockImplementation(table => {
      if (table === 'bots') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'bot_3',
              name: 'NewBot',
              user_id: 'test_user_id',
              created_at: '2024-01-03T00:00:00Z',
            },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null,
        }),
      };
    });

    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/bot name/i);
    const createButton = screen.getByTestId('create-bot-submit');

    await userEvent.type(nameInput, 'NewBot');

    // Find and click the submit button instead of submitting the form directly
    await userEvent.click(createButton);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('bots');
  });

  it('deletes a bot', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Find and click delete button instead of submitting the form
    const deleteForms = await screen.findAllByTestId('delete-bot-form');
    const deleteButton = within(deleteForms[0]).getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('bots');
  });

  it('handles logout', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Find and click logout button instead of submitting the form
    const logoutForm = screen.getByTestId('logout-form');
    const logoutButton = within(logoutForm).getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('displays subscription status correctly', async () => {
    // Test for subscribed user
    const mockSupabaseClient = createMockSupabaseClient({
      userProfile: { id: 'test_user_id', subscribed: true },
    });
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/premium subscription/i)).toBeInTheDocument();
  });

  it('shows subscription management button', async () => {
    const mockSupabaseClient = createMockSupabaseClient({});
    (createBrowserClient as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(
      mockSupabaseClient
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });
});
