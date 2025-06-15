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
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    subscribed?: boolean;
  };
}

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
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
          const { error: profileError } = await client
            .from(USERS_TABLE)
            .select('subscribed')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === '42P01') {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold" data-testid="dashboard-title">
          Dashboard
        </h1>
        <div>
          {user?.email && (
            <span className="mr-4" data-testid="user-email">
              {user.email}
            </span>
          )}
          <form onSubmit={handleLogout} data-testid="logout-form">
            <Button type="submit" data-testid="logout-button">
              Logout
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Bots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="total-bots">
              {bots.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-3xl font-bold" data-testid="subscription-status">
                {user?.user_metadata?.subscribed ? 'Active' : 'Inactive'}
              </p>
              {user?.user_metadata?.subscribed ? (
                <p className="text-green-600 font-semibold" data-testid="premium-subscription">
                  Premium Subscription
                </p>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upgrade to Premium Subscription
                  </p>
                  <Button onClick={() => router.push('/pricing')} data-testid="subscribe-button">
                    Subscribe
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBot} data-testid="create-bot-form">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Bot Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter bot name"
                    required
                    data-testid="bot-name-input"
                  />
                </div>
                <Button type="submit" data-testid="create-bot-submit">
                  Create Bot
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Bots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="bots-list">
              {bots.length === 0 ? (
                <p>No bots created yet</p>
              ) : (
                bots.map(bot => (
                  <div
                    key={bot.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`bot-item-${bot.id}`}
                  >
                    <span data-testid={`bot-name-${bot.id}`}>{bot.name}</span>
                    <form onSubmit={handleDeleteBot} data-testid="delete-bot-form">
                      <input type="hidden" name="id" value={bot.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        data-testid={`delete-bot-button-${bot.id}`}
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
