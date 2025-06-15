import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { botId, message } = await request.json();

    if (!botId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the bot details
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('model')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // TODO: Implement actual AI model integration
    // For now, return a mock response
    const mockResponse = `I'm a ${bot.model} powered chatbot. You said: "${message}"`;

    return NextResponse.json({ message: mockResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
