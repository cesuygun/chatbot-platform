import { http, HttpResponse } from 'msw';

const mockChatbots = [
  { id: '1', name: 'Customer Support', last_updated: '2 days ago', messages: 1245, avg_rating: 4.8 },
  { id: '2', name: 'Product FAQ', last_updated: '5 days ago', messages: 832, avg_rating: 4.5 },
  { id: '3', name: 'Lead Generation', last_updated: '1 week ago', messages: 2109, avg_rating: 4.9 },
];

const mockSubscription = {
  plan: {
    name: 'Pro',
    chatbot_limit: 10,
  },
  usage: {
    chatbots: 3,
  },
};

export const handlers = [
  http.get('http://localhost/api/chatbots', () => {
    return HttpResponse.json(mockChatbots);
  }),
  http.get('http://localhost/api/stripe/subscription', () => {
    return HttpResponse.json(mockSubscription);
  }),
  http.post('http://localhost/api/chat', () => {
    return HttpResponse.json({ response: 'Test response' });
  }),
]; 