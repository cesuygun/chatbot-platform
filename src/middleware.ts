import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// List of paths that should be excluded from rate limiting
const EXCLUDED_PATHS = ['/api/stripe/checkout', '/api/stripe/webhook'];

// List of paths that should redirect to dashboard if user is authenticated
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

// Create Supabase client for middleware (same pattern as app)
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist in middleware
      autoRefreshToken: false, // Don't auto-refresh in middleware
    },
  });
};

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Add subscription data to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-subscription-plan', subscription?.plan_name || 'free');
    response.headers.set('x-subscription-plan', subscription?.plan_name || 'free');

    // Example of feature gating:
    // This is a placeholder for now and will be expanded upon.
    if (
      request.nextUrl.pathname.startsWith('/dashboard/chatbots') &&
      subscription?.plan_name === 'free'
    ) {
      if (session) {
        const { count } = await supabase
          .from('chatbots')
          .select('*', { count: 'exact' })
          .eq('user_id', session.user.id);

        // If a free user tries to create more than one chatbot, redirect them.
        if (count && count >= 1 && request.nextUrl.pathname.endsWith('/create')) {
          return NextResponse.redirect(
            new URL('/dashboard/upgrade?reason=chatbot_limit', request.url)
          );
        }
      }
    }
  }

  return response;
};

export const middleware = async (request: NextRequest) => {
  return await updateSession(request);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
