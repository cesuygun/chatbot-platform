import { test as base } from '@playwright/test';

// Extend Window interface to include AuthContext and getSupabase
declare global {
  interface Window {
    AuthContext: {
      user: null;
      loading: boolean;
      signIn: () => Promise<{ error: null }>;
      signUp: () => Promise<{ error: null }>;
      signOut: () => Promise<{ error: null }>;
      resetPassword: () => Promise<{ error: null }>;
    };
    getSupabase: () => {
      auth: {
        getUser: () => Promise<{ data: { user: null }, error: null }>;
        signIn: () => Promise<{ data: { user: null }, error: null }>;
        signUp: () => Promise<{ data: { user: null }, error: null }>;
        signOut: () => Promise<{ error: null }>;
        resetPasswordForEmail: () => Promise<{ error: null }>;
        getSession: () => Promise<{ data: { session: null }, error: null }>;
        onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
      };
    };
  }
}

// Extend the base test type with our custom fixtures
type AuthFixtures = {
  mockAuth: {
    user: null;
    loading: false;
    signIn: () => Promise<{ error: null }>;
    signUp: () => Promise<{ error: null }>;
    signOut: () => Promise<{ error: null }>;
    resetPassword: () => Promise<{ error: null }>;
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
          signIn: async () => ({ error: null }),
          signUp: async () => ({ error: null }),
          signOut: async () => ({ error: null }),
          resetPassword: async () => ({ error: null }),
        };

        window.getSupabase = () => ({
          auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            signIn: async () => ({ data: { user: null }, error: null }),
            signUp: async () => ({ data: { user: null }, error: null }),
            signOut: async () => ({ error: null }),
            resetPasswordForEmail: async () => ({ error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          },
        });
      });

      await use({
        user: null,
        loading: false,
        signIn: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signOut: async () => ({ error: null }),
        resetPassword: async () => ({ error: null }),
      });
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test'; 