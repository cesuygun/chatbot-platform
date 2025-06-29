'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, File, Trash2, Copy, ExternalLink } from 'lucide-react';
import { ChatbotPreview } from '@/components/chatbot/ChatbotPreview';
import { Chatbot } from '@/types/chatbot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface KnowledgeSource {
  id: string;
  name: string;
  type: string;
}

// Mock data for knowledge sources - this will be replaced with real data
const mockSources: KnowledgeSource[] = [
  { id: '1', name: 'Product_Manual.pdf', type: 'pdf' },
  { id: '2', name: 'FAQ_Document.pdf', type: 'pdf' },
];

const KnowledgeBaseUploader = ({ chatbotId }: { chatbotId: string }) => {
  const [uploading, setUploading] = useState(false);
  const [sources, setSources] = useState<KnowledgeSource[]>(mockSources);

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
    } catch {
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
            {sources.map((source: KnowledgeSource) => (
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

const SettingsTab = ({
  chatbot,
  onSettingsSave,
}: {
  chatbot: Chatbot;
  onSettingsSave: (newSettings: Chatbot) => void;
}) => {
  const router = useRouter();
  const [settings, setSettings] = useState({
    name: chatbot.name || '',
    description: chatbot.description || '',
    welcome_message: chatbot.welcome_message || 'Hello! How can I help you today?',
  });
  const [aiModel, setAiModel] = useState(chatbot.ai_model || 'gpt-4');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chatbot');
      }

      alert('Chatbot deleted successfully!');
      router.push('/dashboard/chatbots');
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ai_model: aiModel }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedChatbot = await response.json();
      onSettingsSave(updatedChatbot); // Pass updated data to parent
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="name">Chatbot Name</Label>
          <Input
            id="name"
            value={settings.name}
            onChange={e => setSettings({ ...settings, name: e.target.value })}
            placeholder="Enter chatbot name"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={settings.description}
            onChange={e => setSettings({ ...settings, description: e.target.value })}
            placeholder="Describe your chatbot"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={settings.welcome_message}
            onChange={e => setSettings({ ...settings, welcome_message: e.target.value })}
            placeholder="Message users will see when they first open the chat"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="model">AI Model</Label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
      <CardFooter className="border-t pt-6 mt-6">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These actions are permanent and cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Chatbot</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your chatbot and all of
                  its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Continue'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

const AppearanceTab = ({
  chatbot,
  onSettingsSave,
}: {
  chatbot: Chatbot;
  onSettingsSave: (newSettings: Chatbot) => void;
}) => {
  const [appearance, setAppearance] = useState({
    primary_color: chatbot.primary_color || '#3B82F6',
    secondary_color: chatbot.secondary_color || '#F3F4F6',
    border_radius: chatbot.border_radius ?? 8,
    show_branding: chatbot.show_branding ?? true,
    custom_css: chatbot.custom_css || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appearance),
      });

      if (!response.ok) {
        throw new Error('Failed to save appearance settings');
      }

      const updatedChatbot = await response.json();
      onSettingsSave(updatedChatbot);
      alert('Appearance settings saved!');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="primaryColor"
              type="color"
              value={appearance.primary_color}
              onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })}
              className="w-16"
            />
            <Input
              value={appearance.primary_color}
              onChange={e => setAppearance({ ...appearance, primary_color: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="borderRadius">Border Radius (px)</Label>
          <Input
            id="borderRadius"
            type="number"
            value={appearance.border_radius}
            onChange={e =>
              setAppearance({ ...appearance, border_radius: parseInt(e.target.value, 10) })
            }
            placeholder="e.g., 8"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="showBranding"
            checked={appearance.show_branding}
            onCheckedChange={checked => setAppearance({ ...appearance, show_branding: checked })}
          />
          <Label htmlFor="showBranding">Show Chatbot Platform Branding</Label>
        </div>

        <div>
          <Label htmlFor="customCSS">Custom CSS</Label>
          <Textarea
            id="customCSS"
            value={appearance.custom_css}
            onChange={e => setAppearance({ ...appearance, custom_css: e.target.value })}
            placeholder="e.g., .chatbot-header { background-color: #000; }"
            rows={5}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

const DeployTab = ({ chatbotId }: { chatbotId: string }) => {
  const [origin, setOrigin] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const embedCode = `<script src="${origin}/embed.js" data-chatbot-id="${chatbotId}" defer></script>`;
  const apiEndpoint = `${origin}/api/chat`;
  const directLink = `${origin}/chat/${chatbotId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTestApi = () => {
    // You can implement a more sophisticated test, like opening a pre-filled API client (e.g., Postman)
    // For now, we'll just open the endpoint in a new tab, which isn't directly useful for a POST endpoint
    // but demonstrates the button works.
    alert('This would typically open an API testing tool or documentation for this endpoint.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <Label>Embed Code</Label>
          <div className="flex gap-2">
            <Input readOnly value={embedCode} className="font-mono" />
            <Button variant="outline" onClick={() => copyToClipboard(embedCode)}>
              {isCopied ? 'Copied!' : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Add this code to your website to embed the chatbot.
          </p>
        </div>
        <div>
          <Label>API Endpoint</Label>
          <div className="flex gap-2">
            <Input readOnly value={apiEndpoint} className="font-mono" />
            <Button variant="outline" onClick={handleTestApi}>
              <ExternalLink className="h-4 w-4 mr-2" /> Test
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Use this endpoint to integrate the chatbot with your custom application.
          </p>
        </div>
        <div>
          <Label>Direct Link</Label>
          <div className="flex gap-2">
            <Input readOnly value={directLink} className="font-mono" />
            <Button variant="outline" asChild>
              <a href={directLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Open
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Direct link to the chatbot interface.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const ChatbotEditorClient = ({ chatbotId }: { chatbotId: string }) => {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatbot = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chatbots/${chatbotId}`);
        if (res.ok) {
          const data = await res.json();
          setChatbot(data);
        } else {
          throw new Error('Failed to fetch chatbot data');
        }
      } catch (error) {
        console.error('Error fetching chatbot:', error);
        setChatbot(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChatbot();
  }, [chatbotId]);

  const handleSettingsSave = (newSettings: Chatbot) => {
    setChatbot(newSettings);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!chatbot) {
    return <div>Chatbot not found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Edit: {chatbot.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="settings">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="knowledge_base">Knowledge Base</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <SettingsTab chatbot={chatbot} onSettingsSave={handleSettingsSave} />
            </TabsContent>
            <TabsContent value="knowledge_base">
              <KnowledgeBaseUploader chatbotId={chatbot.id} />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceTab chatbot={chatbot} onSettingsSave={handleSettingsSave} />
            </TabsContent>
            <TabsContent value="deploy">
              <DeployTab chatbotId={chatbot.id} />
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Chatbot Preview</h2>
          <div className="border rounded-lg shadow-sm bg-white h-[600px]">
            <ChatbotPreview chatbotId={chatbot.id} welcomeMessage={chatbot.welcome_message ?? ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotEditorClient;
