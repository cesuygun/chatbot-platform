'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, File, Trash2 } from 'lucide-react';
import { ChatbotPreview } from '@/components/chatbot/ChatbotPreview';

// Mock data for knowledge sources - this will be replaced with real data
const mockSources = [
  { id: '1', name: 'Product_Manual.pdf', type: 'pdf' },
  { id: '2', name: 'FAQ_Document.pdf', type: 'pdf' },
];

const KnowledgeBaseUploader = ({ chatbotId }: { chatbotId: string }) => {
  const [uploading, setUploading] = useState(false);
  const [sources, setSources] = useState(mockSources);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatbotId', chatbotId);

    try {
      const response = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert('File uploaded successfully!');
        setSources([...sources, { id: result.sourceId, name: file.name, type: 'pdf' }]);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      alert('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">
            Drag and drop PDF files here, or click to browse.
          </p>
          <Input
            type="file"
            className="hidden"
            id="file-upload"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button asChild variant="outline" className="mt-4">
            <label htmlFor="file-upload">{uploading ? 'Uploading...' : 'Browse Files'}</label>
          </Button>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Uploaded Documents</h3>
          <ul className="space-y-2">
            {sources.map(source => (
              <li
                key={source.id}
                className="flex items-center justify-between bg-gray-100 p-3 rounded-md"
              >
                <div className="flex items-center">
                  <File className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{source.name}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ChatbotEditorPage({ params }: { params: { id: string } }) {
  // Mock data for the chatbot itself
  const chatbot = {
    id: params.id,
    name: 'Customer Support Bot',
    welcomeMessage: "Hi! I'm your support assistant. Ask me anything about our products.",
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Edit: {chatbot.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="knowledge">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Settings for the chatbot will be here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge">
              <KnowledgeBaseUploader chatbotId={chatbot.id} />
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Customization options for the chatbot widget will be here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deploy">
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Embed codes and API keys for deployment will be here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Chatbot Preview</h2>
          <div className="border rounded-lg shadow-sm bg-white h-[600px]">
            <ChatbotPreview chatbotId={chatbot.id} welcomeMessage={chatbot.welcomeMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
