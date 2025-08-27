-- Add avatar_headshot_url column to ChildProfile table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE "ChildProfile" 
ADD COLUMN IF NOT EXISTS "avatar_headshot_url" TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN "ChildProfile"."avatar_headshot_url" IS 'URL to the generated headshot/profile picture from the 3D avatar';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ChildProfile' 
AND column_name = 'avatar_headshot_url';