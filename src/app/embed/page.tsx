'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmbedPage() {
  const [botId, setBotId] = useState('');
  const embedCode = `<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatbotWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id='chatbot-widget';js.src='${process.env.NEXT_PUBLIC_APP_URL}/embed.js';
    js.async=1;js.dataset.botId='${botId}';
    fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatbot'));
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Embed Your Chatbot</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bot ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="botId">Enter your bot ID</Label>
              <Input
                id="botId"
                value={botId}
                onChange={e => setBotId(e.target.value)}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy and paste this code into your website&apos;s HTML, just before the closing
                &lt;/body&gt; tag.
              </p>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <Button onClick={handleCopy}>Copy Code</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
