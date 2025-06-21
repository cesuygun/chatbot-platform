export interface Chatbot {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  welcome_message?: string | null;
  ai_model: string;
  created_at: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  border_radius?: number | null;
  show_branding?: boolean | null;
  custom_css?: string | null;
} 