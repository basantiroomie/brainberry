-- Add avatar support to ChildProfile table
ALTER TABLE public."ChildProfile" 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public."ChildProfile".avatar_url IS 'URL for the Ready Player Me .glb 3D model.';