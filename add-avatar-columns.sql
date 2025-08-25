-- Add avatar support columns to ChildProfile table
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Add avatar columns to existing ChildProfile table
ALTER TABLE public."ChildProfile" 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
  "can_customize": true,
  "can_chat": true,
  "chat_time_limit_minutes": 30
}'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_url ON public."ChildProfile"(avatar_url);
CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_headshot_url ON public."ChildProfile"(avatar_headshot_url);

-- Add comments for documentation
COMMENT ON COLUMN public."ChildProfile".avatar_url IS 'URL to the child''s 3D avatar model from Ready Player Me';
COMMENT ON COLUMN public."ChildProfile".avatar_headshot_url IS 'URL to the 2D headshot image generated from the 3D avatar';
COMMENT ON COLUMN public."ChildProfile".avatar_permissions IS 'JSON object containing avatar feature permissions and settings';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ChildProfile' 
AND column_name IN ('avatar_url', 'avatar_headshot_url', 'avatar_permissions')
ORDER BY column_name;