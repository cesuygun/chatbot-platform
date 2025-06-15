import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signIn: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
  },
};

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

export { mockSupabase }; 