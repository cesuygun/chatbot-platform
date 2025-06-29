import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Chatbot } from '@/types/chatbot';

interface Plan {
  name: string;
  interval: string;
  amount: number;
  chatbot_limit?: number; // Optional for backward compatibility
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: Plan;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch subscription and chatbots in parallel
        const [subResponse, chatbotsResponse] = await Promise.all([
          fetch('/api/stripe/subscription'),
          fetch('/api/chatbots'),
        ]);

        if (subResponse.ok) {
          const subData = await subResponse.json();
          setSubscription(subData.subscription);
        }

        if (chatbotsResponse.ok) {
          const chatbotsData = await chatbotsResponse.json();
          setChatbots(chatbotsData);
        }

      } catch (error) {
        console.error('Failed to fetch subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { subscription, chatbots, subscriptionLoading: loading };
}; 