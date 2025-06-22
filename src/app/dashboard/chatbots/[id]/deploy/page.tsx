'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

export default function DeployChatbotPage() {
  const params = useParams();
  const chatbotId = params.id as string;
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const embedScript = `<script
  src="${origin}/embed.js"
  data-chatbot-id="${chatbotId}"
  defer
></script>`;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Deploy Your Chatbot</h1>
        <Card>
          <CardHeader>
            <CardTitle>Embed on Your Website</CardTitle>
            <CardDescription>
              Copy and paste this snippet into your website&apos;s HTML just before the closing
              `&lt;/body&gt;` tag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto">
              <code>{embedScript}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
