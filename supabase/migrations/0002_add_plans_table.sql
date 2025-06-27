-- Add plans table to store plan configurations
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  chatbot_limit INTEGER NOT NULL,
  message_limit INTEGER NOT NULL,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default plans
INSERT INTO plans (id, name, description, price, interval, chatbot_limit, message_limit, features) VALUES
('free', 'Free', 'For individuals and small projects', 0.00, 'month', 1, 100, '{"knowledge_base": true, "pdf_upload": true, "analytics": true}'),
('pro', 'Pro', 'For growing businesses', 29.00, 'month', 5, 2000, '{"knowledge_base": true, "pdf_upload": true, "analytics": true, "custom_branding": true, "api_access": true}'),
('enterprise', 'Enterprise', 'For large organizations', 99.00, 'month', 9999, 10000, '{"knowledge_base": true, "pdf_upload": true, "analytics": true, "custom_branding": true, "api_access": true, "white_label": true}');

-- Add plan_id to subscriptions and migrate data
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Backfill plan_id based on plan_name (if plan_name exists)
UPDATE subscriptions SET plan_id = plan_name WHERE plan_id IS NULL AND plan_name IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE subscriptions
  ADD CONSTRAINT fk_subscriptions_plan_id
  FOREIGN KEY (plan_id) REFERENCES plans(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_chatbot_id ON knowledge_sources(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id); 