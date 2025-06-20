'use client';
export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { getSupabase } from '@/lib/supabase/client';

const BOTS_TABLE = 'bots';
const USERS_TABLE = 'users';

// Local types
interface Bot {
  id: string;
  name: string;
}

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load bots when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      const loadBots = async () => {
        try {
          const supabase = getSupabase();
          const { data: botsData, error: botsError } = await supabase
            .from(BOTS_TABLE)
            .select('id, name')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!botsError) {
            setBots((botsData as Bot[]) || []);
          }

          // Check user subscription status
          try {
            const { error: profileError } = await supabase
              .from(USERS_TABLE)
              .select('subscribed')
              .eq('id', user.id)
              .single();

            if (profileError && profileError.code === '42P01') {
              console.error(
                "Users table doesn't exist. Please create it with the SQL script provided."
              );
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } catch (error) {
          console.error('Error loading bots:', error);
        }
      };

      loadBots();
    }
  }, [user, authLoading]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (should redirect)
  if (!user) {
    return null;
  }

  const handleLogout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateBot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
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

      const supabase = getSupabase();

      // First, check if the table exists
      const { error: tableCheckError } = await supabase.from(BOTS_TABLE).select('id').limit(1);

      if (tableCheckError) {
        console.error('Error checking bots table:', tableCheckError);
        if (tableCheckError.code === '42P01') {
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
        console.error('Error creating bot:', error);
        return;
      }

      console.log('Bot created successfully:', data);
      if (data && typeof data === 'object' && 'id' in data && 'name' in data) {
        setBots(prevBots => [{ id: data.id as string, name: data.name as string }, ...prevBots]);
      }

      // Reset form
      e.currentTarget.reset();
    } catch (error) {
      console.error('Unexpected error creating bot:', error);
    }
  };

  const handleDeleteBot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const botId = formData.get('botId') as string;
    if (!botId) {
      console.error('Bot ID is required');
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from(BOTS_TABLE)
        .delete()
        .eq('id', botId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting bot:', error);
        return;
      }

      setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
    } catch (error) {
      console.error('Unexpected error deleting bot:', error);
    }
  };

  const handleOpenEmbedDialog = (bot: Bot) => {
    setSelectedBot(bot);
    setEmbedDialogOpen(true);
  };

  const handleCloseEmbedDialog = () => {
    setEmbedDialogOpen(false);
    setSelectedBot(null);
    setCopied(false);
  };

  const handleCopyEmbedCode = () => {
    if (selectedBot) {
      const embedCode = `<script src="${window.location.origin}/embed.js"></script>
<div id="chatbot-widget" data-bot-id="${selectedBot.id}"></div>`;

      navigator.clipboard.writeText(embedCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user.user_metadata?.full_name || user.email}
          </p>
        </div>
        <form onSubmit={handleLogout}>
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Create Bot Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input id="name" name="name" type="text" required placeholder="Enter bot name" />
              </div>
              <Button type="submit" className="w-full">
                Create Bot
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div>
              <Label>Subscription Status</Label>
              <p className="text-sm text-gray-600">
                {user.user_metadata?.subscribed ? 'Active' : 'Free Plan'}
              </p>
            </div>
            {!user.user_metadata?.subscribed && (
              <Button onClick={() => router.push('/pricing')} className="w-full">
                Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bots List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Bots</CardTitle>
        </CardHeader>
        <CardContent>
          {bots.length === 0 ? (
            <p className="text-gray-500">No bots created yet. Create your first bot above.</p>
          ) : (
            <div className="space-y-4">
              {bots.map(bot => (
                <div
                  key={bot.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{bot.name}</h3>
                    <p className="text-sm text-gray-500">ID: {bot.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEmbedDialog(bot)}>
                      Get Embed Code
                    </Button>
                    <form onSubmit={handleDeleteBot} className="inline">
                      <input type="hidden" name="botId" value={bot.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embed Code Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Code for {selectedBot?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy and paste this code into your website to embed the chatbot:
            </p>
            <Textarea
              value={
                selectedBot
                  ? `<script src="${window.location.origin}/embed.js"></script>
<div id="chatbot-widget" data-bot-id="${selectedBot.id}"></div>`
                  : ''
              }
              readOnly
              className="font-mono text-sm"
              rows={4}
            />
            <DialogFooter>
              <Button onClick={handleCopyEmbedCode} disabled={copied}>
                {copied ? 'Copied!' : <Copy className="w-4 h-4 mr-2" />}
                Copy Code
              </Button>
              <Button variant="outline" onClick={handleCloseEmbedDialog}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
