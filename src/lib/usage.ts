import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter
const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

export interface UsageLimits {
  messagesPerMonth: number;
  chatbots: number;
}

export interface UsageStats {
  currentMessages: number;
  currentChatbots: number;
  limits: UsageLimits;
}

export const checkUsageLimits = async (
  userId: string,
  chatbotId?: string
): Promise<{ allowed: boolean; reason?: string }> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user's subscription and plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .single();

  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const plan = subscription.plan;
  if (!plan) {
    return { allowed: false, reason: 'Plan not found' };
  }

  // Check chatbot limit
  const { count: chatbotCount } = await supabase
    .from('chatbots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (chatbotCount !== null && chatbotCount >= plan.chatbot_limit && plan.chatbot_limit !== -1) {
    return { allowed: false, reason: `Chatbot limit exceeded (${plan.chatbot_limit})` };
  }

  // Check message limit for the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', 
      supabase
        .from('conversations')
        .select('id')
        .eq('chatbot_id', chatbotId)
    )
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  if (messageCount !== null && messageCount >= plan.message_limit) {
    return { allowed: false, reason: `Message limit exceeded (${plan.message_limit})` };
  }

  return { allowed: true };
};

export const trackMessageUsage = async (
  userId: string,
  chatbotId: string,
  _conversationId: string
): Promise<void> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Record the message in usage_stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await supabase
    .from('usage_stats')
    .upsert({
      user_id: userId,
      chatbot_id: chatbotId,
      message_count: 1,
      period_start: startOfMonth.toISOString(),
      period_end: endOfMonth.toISOString(),
    }, {
      onConflict: 'user_id,chatbot_id,period_start',
      ignoreDuplicates: false,
    });
};

export const getUsageStats = async (userId: string): Promise<UsageStats> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get subscription and plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .single();

  const plan = subscription?.plan || {
    message_limit: 100,
    chatbot_limit: 1,
  };

  // Get current usage
  const { count: chatbotCount } = await supabase
    .from('chatbots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get user's chatbot IDs first
  const { data: userChatbots } = await supabase
    .from('chatbots')
    .select('id')
    .eq('user_id', userId);

  const chatbotIds = userChatbots?.map(c => c.id) || [];

  // Get conversation IDs for user's chatbots
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .in('chatbot_id', chatbotIds);

  const conversationIds = conversations?.map(c => c.id) || [];

  // Get message count for the month
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  return {
    currentMessages: messageCount || 0,
    currentChatbots: chatbotCount || 0,
    limits: {
      messagesPerMonth: plan.message_limit,
      chatbots: plan.chatbot_limit,
    },
  };
};

export const checkRateLimit = async (identifier: string): Promise<{ success: boolean }> => {
  const { success } = await rateLimiter.limit(identifier);
  return { success };
}; 