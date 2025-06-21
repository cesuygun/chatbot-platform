import { NextRequest, NextResponse } from 'next/server';
import { processPdfDocument } from '@/lib/knowledge-base';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const chatbotId = formData.get('chatbotId') as string | null;

    if (!file || !chatbotId) {
      return NextResponse.json({ error: 'File and chatbotId are required' }, { status: 400 });
    }

    const result = await processPdfDocument(file, chatbotId);

    if (result.success) {
      return NextResponse.json({ success: true, sourceId: result.sourceId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 