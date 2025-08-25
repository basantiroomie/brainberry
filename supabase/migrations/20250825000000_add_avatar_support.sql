-- Add avatar support to ChildProfile table
-- Migration: 20250825000000_add_avatar_support.sql

-- Add avatar columns to existing ChildProfile table
ALTER TABLE public."ChildProfile" 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
  "can_customize": true,
  "can_chat": true,
  "chat_time_limit_minutes": 30
}'::jsonb;

-- Create avatar-photos storage bucket for uploaded photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatar-photos',
  'avatar-photos',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create avatar-headshots storage bucket for generated 2D images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatar-headshots',
  'avatar-headshots',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatar-photos bucket
-- Educators can upload avatar photos for their children
CREATE POLICY "Educators can upload avatar photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatar-photos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public."EducatorAccount" 
    WHERE id = auth.uid()
  )
);

-- Educators can view avatar photos for their children
CREATE POLICY "Educators can view avatar photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatar-photos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public."EducatorAccount" 
    WHERE id = auth.uid()
  )
);

-- Educators can update avatar photos for their children
CREATE POLICY "Educators can update avatar photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatar-photos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public."EducatorAccount" 
    WHERE id = auth.uid()
  )
);

-- Educators can delete avatar photos for their children
CREATE POLICY "Educators can delete avatar photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatar-photos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public."EducatorAccount" 
    WHERE id = auth.uid()
  )
);

-- RLS Policies for avatar-headshots bucket
-- System can insert headshot images
CREATE POLICY "System can insert avatar headshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatar-headshots'
);

-- Authenticated users can view avatar headshots
CREATE POLICY "Users can view avatar headshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatar-headshots'
  AND auth.role() = 'authenticated'
);

-- System can update headshot images
CREATE POLICY "System can update avatar headshots" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatar-headshots'
);

-- System can delete headshot images
CREATE POLICY "System can delete avatar headshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatar-headshots'
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_url ON public."ChildProfile"(avatar_url);
CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_headshot_url ON public."ChildProfile"(avatar_headshot_url);

-- Add comments for documentation
COMMENT ON COLUMN public."ChildProfile".avatar_url IS 'URL to the child''s 3D avatar model from Ready Player Me';
COMMENT ON COLUMN public."ChildProfile".avatar_headshot_url IS 'URL to the 2D headshot image generated from the 3D avatar';
COMMENT ON COLUMN public."ChildProfile".avatar_permissions IS 'JSON object containing avatar feature permissions and settings';

-- Create a function to clean up avatar data when a child profile is deleted
CREATE OR REPLACE FUNCTION cleanup_avatar_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete avatar photos from storage
  IF OLD.avatar_url IS NOT NULL THEN
    -- Note: In a real implementation, you'd want to extract the file path
    -- from the URL and delete the actual file from storage
    -- This is a placeholder for the cleanup logic
    NULL;
  END IF;
  
  IF OLD.avatar_headshot_url IS NOT NULL THEN
    -- Note: Similar cleanup for headshot images
    NULL;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cleanup avatar data on child profile deletion
DROP TRIGGER IF EXISTS cleanup_avatar_data_trigger ON public."ChildProfile";
CREATE TRIGGER cleanup_avatar_data_trigger
  BEFORE DELETE ON public."ChildProfile"
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_avatar_data();