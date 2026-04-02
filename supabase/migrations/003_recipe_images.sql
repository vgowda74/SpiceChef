-- Add image_url to recipes table for hero images
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url text;

-- Create public storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to recipe images
CREATE POLICY "Public read recipe images" ON storage.objects
FOR SELECT USING (bucket_id = 'recipe-images');

-- Allow authenticated uploads to recipe images
CREATE POLICY "Allow upload recipe images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'recipe-images');
