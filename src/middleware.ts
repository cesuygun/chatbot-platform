import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle rate limiting for API routes
  if (pathname.startsWith('/api')) {
    try {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      const response = success
        ? NextResponse.next()
        : NextResponse.json({ error: 'Too many requests' }, { status: 429 });

      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return NextResponse.next();
    }
  }

  // Handle authentication
  const res = NextResponse.next();
  const supabase = createSupabaseClient();
  
  // Get session from cookies
  const authCookie = request.cookies.get('sb-zwtfokiutwdssyhdarbw-auth-token');
  let session = null;
  
  if (authCookie) {
    try {
      const { data: { session: sessionData } } = await supabase.auth.getSession();
      session = sessionData;
    } catch (error) {
      console.error('Error getting session in middleware:', error);
    }
  }

  // Redirect to dashboard if accessing auth pages with session
  if (AUTH_PATHS.some(path => pathname.startsWith(path)) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
