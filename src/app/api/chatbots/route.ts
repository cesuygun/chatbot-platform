import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Subscription Limit Check ---
    // 1. Get the user's current subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json({ error: 'Failed to retrieve subscription details.' }, { status: 500 });
    }

    // 2. Get the number of existing chatbots
    const { count: chatbotCount, error: countError } = await supabase
      .from('chatbots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting chatbots:', countError);
      return NextResponse.json({ error: 'Failed to count existing chatbots.' }, { status: 500 });
    }

    // 3. Enforce the limit
    const chatbotLimit = subscriptionData?.plan?.chatbot_limit || 0;
    if (chatbotCount !== null && chatbotCount >= chatbotLimit) {
      return NextResponse.json(
        {
          error: `You have reached your limit of ${chatbotLimit} chatbots. Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }
    // --- End Subscription Limit Check ---

    const { name, description, welcomeMessage } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('chatbots')
      .insert({
        name,
        description: description || '',
        welcome_message: welcomeMessage || 'Hello! How can I help you today?',
        user_id: user.id,
        ai_model: 'gpt-4',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create chatbot' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, ...data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch chatbots' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 