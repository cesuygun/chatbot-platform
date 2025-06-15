'use client';
import { createBrowserClient } from '@supabase/ssr';
import { createContext, useMemo } from 'react';

type SupabaseClientType = ReturnType<typeof createBrowserClient>;
const SupabaseContext = createContext<SupabaseClientType | null>(null);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  const supabase = useMemo(
    () => createBrowserClient(supabaseUrl, supabaseAnonKey),
    [supabaseUrl, supabaseAnonKey]
  );
  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
};
