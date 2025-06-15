import { test as base } from '@playwright/test';

// Extend Window interface to include AuthContext and getSupabase
declare global {
  interface Window {
    AuthContext: {
      user: { id: string; email: string } | null;
      loading: boolean;
      signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
      signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
      signOut: () => Promise<{ error: Error | null }>;
      resetPassword: (email: string) => Promise<{ error: Error | null }>;
    };
    getSupabase: () => {
      auth: {
        getUser: () => Promise<{ data: { user: { id: string; email: string } | null }, error: Error | null }>;
        signIn: (credentials: { email: string; password: string }) => Promise<{ data: { user: { id: string; email: string } | null }, error: Error | null }>;
        signUp: (credentials: { email: string; password: string }) => Promise<{ data: { user: { id: string; email: string } | null }, error: Error | null }>;
        signOut: () => Promise<{ error: Error | null }>;
        resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
        getSession: () => Promise<{ data: { session: { user: { id: string; email: string } } | null }, error: Error | null }>;
        onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
      };
    };
  }
}

// Extend the base test type with our custom fixtures
type AuthFixtures = {
  mockAuth: {
    user: { id: string; email: string } | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
  };
};

// Extend base test with our fixtures
export const test = base.extend<AuthFixtures>({
  mockAuth: [
    async ({ page }, use) => {
      // Mock the auth context and getSupabase function
      await page.addInitScript(() => {
        window.AuthContext = {
          user: null,
          loading: false,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          signIn: async (email: string, password: string) => {
            if (email === 'test@example.com' && password === 'password123') {
              window.AuthContext.user = { id: 'test-user-id', email };
              return { error: null };
            }
            return { error: new Error('Invalid credentials') };
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          signUp: async (email: string, password: string) => {
            if (password.length >= 8) {
              window.AuthContext.user = { id: 'test-user-id', email };
              return { error: null };
            }
            return { error: new Error('Password too short') };
          },
          signOut: async () => {
            window.AuthContext.user = null;
            return { error: null };
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          resetPassword: async (_email) => ({ error: null }),
        };

        window.getSupabase = () => ({
          auth: {
            getUser: async () => ({ data: { user: window.AuthContext.user }, error: null }),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            signIn: async (credentials: { email: string; password: string }) => {
              if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
                const user = { id: 'test-user-id', email: credentials.email };
                window.AuthContext.user = user;
                return { data: { user }, error: null };
              }
              return { data: { user: null }, error: new Error('Invalid credentials') };
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            signUp: async (credentials: { email: string; password: string }) => {
              if (credentials.password.length >= 8) {
                const user = { id: 'test-user-id', email: credentials.email };
                window.AuthContext.user = user;
                return { data: { user }, error: null };
              }
              return { data: { user: null }, error: new Error('Password too short') };
            },
            signOut: async () => {
              window.AuthContext.user = null;
              return { error: null };
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            resetPasswordForEmail: async (_email) => ({ error: null }),
            getSession: async () => ({
              data: { session: window.AuthContext.user ? { user: window.AuthContext.user } : null },
              error: null,
            }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          },
        });
      });

      await use({
        user: null,
        loading: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        signIn: async (email: string, password: string) => {
          if (email === 'test@example.com' && password === 'password123') {
            return { error: null };
          }
          return { error: new Error('Invalid credentials') };
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        signUp: async (email: string, password: string) => {
          if (password.length >= 8) {
            return { error: null };
          }
          return { error: new Error('Password too short') };
        },
        signOut: async () => {
          return { error: null };
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resetPassword: async (_email) => ({ error: null }),
      });
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

export const mockAuth = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signIn: async ({ email, password }: { email: string; password: string }) => {
    if (email === 'test@example.com' && password === 'password123') {
      return { data: { user: { id: 'test-user-id', email } }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid credentials' } };
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signUp: async ({ email, password }: { email: string; password: string }) => {
    if (email === 'existing@example.com') {
      return { data: { user: null }, error: { message: 'User already registered' } };
    }
    return { data: { user: { id: 'test-user-id', email } }, error: null };
  },
  signOut: async () => {
    return { error: null };
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetPassword: async (_args: { email: string }) => ({ data: {}, error: null }),
}; 