-- SpiceChef database schema
-- Run this in your Supabase SQL Editor to set up the tables

-- Cookbooks table
CREATE TABLE IF NOT EXISTS cookbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  author text DEFAULT '',
  file_url text,
  cover_url text,
  recipe_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookbook_id uuid REFERENCES cookbooks(id) ON DELETE CASCADE,
  user_id uuid,
  title text NOT NULL,
  ingredients jsonb DEFAULT '[]'::jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  base_serves int DEFAULT 4,
  tags text[] DEFAULT '{}',
  duration_mins int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Cook sessions table (for tracking cooking history)
CREATE TABLE IF NOT EXISTS cook_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  step_index int DEFAULT 0,
  serves int DEFAULT 2
);

-- Storage bucket for cookbook PDFs
-- Run this separately or via the Supabase Dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cookbooks', 'cookbooks', false);

-- RLS policies (permissive for now, tighten after auth)
ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (before auth is implemented)
CREATE POLICY "Allow all cookbook operations" ON cookbooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all recipe operations" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all session operations" ON cook_sessions FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_cookbook ON recipes(cookbook_id);
CREATE INDEX IF NOT EXISTS idx_sessions_recipe ON cook_sessions(recipe_id);
