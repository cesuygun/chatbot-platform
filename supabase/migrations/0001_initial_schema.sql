-- This script sets up the foundational database schema for the ChatPro SaaS platform.
-- It includes tables for managing users, subscriptions, customers, chatbots,
-- knowledge bases, conversations, and usage statistics.

-- Enable the UUID extension if not already enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable the pg_vector extension for similarity search.
CREATE EXTENSION IF NOT EXISTS "vector";

-- Table to link Supabase auth users to Stripe customers.
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT
);

-- Table to store subscription details for each user.
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table to manage the chatbots created by users.
CREATE TABLE IF NOT EXISTS chatbots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  welcome_message TEXT,
  ai_model TEXT DEFAULT 'gpt-3.5-turbo',
  appearance JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table to store the various knowledge sources for each chatbot (e.g., PDF, URL).
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL, -- 'pdf', 'url', 'text'
  source_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table for storing vector embeddings of knowledge base content.
-- This table is used by LangChain and pg_vector for similarity searches.
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    id bigserial PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(1536) -- OpenAI's text-embedding-ada-002 model has 1536 dimensions.
);

-- Function to perform similarity search on vector embeddings.
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count INT,
  filter JSONB
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_embeddings.id,
    knowledge_embeddings.content,
    knowledge_embeddings.metadata,
    1 - (knowledge_embeddings.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings
  WHERE knowledge_embeddings.metadata @> filter
  ORDER BY knowledge_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Table to track message usage per user/chatbot for plan enforcement.
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE
);

-- Table to group messages into conversations.
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT, -- To track anonymous users on a website
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table to store individual chat messages.
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
); 