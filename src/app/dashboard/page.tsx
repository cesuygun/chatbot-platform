'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const BOTS_TABLE = 'bots';
const USERS_TABLE = 'users'; // Define constant for users table

// Local types
interface Bot {
  id: string;
  name: string;
}
interface UserProfile {
  subscribed: boolean;
}
interface User {
  id: string;
  email?: string;
}

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const initializationRef = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Skip if already initialized to prevent double execution in development
    if (initializationRef.current) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    setSupabase(client);

    const initialize = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (userError || !user) {
          setAuthChecked(true);
          router.push('/login');
          return;
        }

        setUser(user);
        setAuthChecked(true);

        const { data: botsData, error: botsError } = await client
          .from(BOTS_TABLE)
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!botsError) {
          setBots(botsData || []);
        }

        // First check if the users table exists
        try {
          const { data: profileData, error: profileError } = await client
            .from(USERS_TABLE)
            .select('subscribed')
            .eq('id', user.id)
            .single();

          if (!profileError) {
            setUserProfile(profileData);
          } else if (profileError.code === '42P01') {
            // Table doesn't exist
            console.error(
              "Users table doesn't exist. Please create it with the SQL script provided."
            );
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setAuthChecked(true);
        router.push('/login');
      } finally {
        // Loading complete
        setAuthChecked(true);
      }
    };

    initialize();
    // Mark as initialized to prevent double execution
    initializationRef.current = true;
  }, [router]);

  // Don't render anything until auth check is complete
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If auth check is complete but we don't have a user, don't render
  // as we should already be redirecting
  if (authChecked && !user) {
    return null;
  }

  const handleLogout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      // Clear local state
      setUser(null);
      setBots([]);
      setUserProfile(null);
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  const handleCreateBot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !supabase) {
      console.error('Missing user or supabase client:', { user, supabase });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name) {
      console.error('Bot name is required');
      return;
    }

    try {
      console.log('Creating bot with data:', { name, user_id: user.id });

      // First, check if the table exists
      const { error: tableCheckError } = await supabase.from(BOTS_TABLE).select('id').limit(1);

      if (tableCheckError) {
        console.error('Error checking bots table:', tableCheckError);
        // If the table doesn't exist, we'll get a specific error
        if (tableCheckError.code === '42P01') {
          // PostgreSQL error code for undefined_table
          console.error(
            'Bots table does not exist. Please create it in Supabase with the following structure:'
          );
          console.error(`
						CREATE TABLE bots (
							id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
							name TEXT NOT NULL,
							user_id UUID NOT NULL REFERENCES auth.users(id),
							created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
						);
					`);
          return;
        }
        return;
      }

      // If we get here, the table exists, so proceed with bot creation
      const { data, error } = await supabase
        .from(BOTS_TABLE)
        .insert([{ name, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating bot:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      if (data) {
        console.log('Bot created successfully:', data);
        setBots(prev => [data, ...prev]);
        if (e.currentTarget && typeof (e.currentTarget as HTMLFormElement).reset === 'function') {
          (e.currentTarget as HTMLFormElement).reset();
        }
      } else {
        console.error('No data returned after bot creation');
      }
    } catch (error) {
      console.error('Unexpected error creating bot:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
    }
  };

  const handleDeleteBot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !supabase) return;

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id') as string;
    if (!id) return;

    const { error } = await supabase.from(BOTS_TABLE).delete().eq('id', id);

    if (!error) {
      setBots(prev => prev.filter(bot => bot.id !== id));
    }
  };

  const handleSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) {
      console.error('User ID is required for subscription');
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Subscription error:', data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error initiating subscription:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="mb-4">
          Welcome, <span className="font-mono">{user?.email ?? 'No email'}</span>
        </p>
        <form onSubmit={handleLogout} data-testid="logout-form">
          <Button type="submit" variant="destructive">
            Logout
          </Button>
        </form>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateBot}
              className="flex gap-2 items-end"
              data-testid="create-bot-form"
            >
              <div className="flex-1">
                <Label htmlFor="name">Bot Name</Label>
                <Input id="name" name="name" required placeholder="e.g. SupportBot" />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Bots</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {bots && bots.length > 0 ? (
                bots.map(bot => (
                  <li key={bot.id} className="flex items-center justify-between">
                    <span>{bot.name}</span>
                    <form onSubmit={handleDeleteBot} data-testid="delete-bot-form">
                      <input type="hidden" name="id" value={bot.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Delete
                      </Button>
                    </form>
                  </li>
                ))
              ) : (
                <li>No bots found.</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-semibold">Status:</span>{' '}
              {userProfile?.subscribed ? (
                <span className="text-green-600">Premium Subscription</span>
              ) : (
                <span className="text-gray-500">Free Plan</span>
              )}
            </div>
            <form onSubmit={handleSubscription} data-testid="subscription-form">
              <Button type="submit" disabled={!user?.id}>
                Subscribe / Manage Billing
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
