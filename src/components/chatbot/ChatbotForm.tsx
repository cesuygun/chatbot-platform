import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ChatbotFormProps {
  onSuccess?: (botId: string) => void;
  onError?: (error: Error) => void;
}

interface FormData {
  name: string;
  description: string;
  model: string;
}

interface FormErrors {
  name?: string;
  model?: string;
}

const MODELS = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
] as const;

export const ChatbotForm = ({ onSuccess, onError }: ChatbotFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    model: '',
  });

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    setSupabase(createBrowserClient(supabaseUrl, supabaseAnonKey));
  }, []);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) {
      errors.name = 'Bot name is required';
    }
    if (!formData.model) {
      errors.model = 'Model selection is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleModelChange = (value: string) => {
    setFormData(prev => ({ ...prev, model: value }));
    // Clear error when user selects a model
    if (formErrors.model) {
      setFormErrors(prev => ({ ...prev, model: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      setError('Database client not initialized');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create bot
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            model: formData.model,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (botError) {
        throw botError;
      }

      onSuccess?.(bot.id);
      setFormData({ name: '', description: '', model: '' });
      setFormErrors({});
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create chatbot');
      setError(error.message || String(error));
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Bot Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="My Awesome Bot"
          required
          disabled={isLoading}
          aria-invalid={!!formErrors.name}
        />
        {formErrors.name && (
          <div className="text-sm text-red-500" role="alert">
            {formErrors.name}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What does your bot do?"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          name="model"
          value={formData.model}
          onValueChange={handleModelChange}
          required
          disabled={isLoading}
        >
          <SelectTrigger aria-invalid={!!formErrors.model}>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.model && (
          <div className="text-sm text-red-500" role="alert">
            {formErrors.model}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Bot'}
      </Button>
    </form>
  );
};
