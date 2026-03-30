-- Add is_featured flag to cookbooks table
-- Featured cookbooks are loaded from the backend and don't count against user limits
ALTER TABLE cookbooks ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Index for quick featured cookbook lookups
CREATE INDEX IF NOT EXISTS idx_cookbooks_featured ON cookbooks (is_featured) WHERE is_featured = true;
