-- Add support for educator-created molds in the studio
-- This migration adds necessary fields and permissions for the no-code mold studio

-- Add created_by field to track which educator created each mold
ALTER TABLE public."GameMold" 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add metadata field to store structured learning objectives
ALTER TABLE public."GameMold" 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gamemold_created_by ON public."GameMold"(created_by);
CREATE INDEX IF NOT EXISTS idx_gamemold_metadata ON public."GameMold" USING gin(metadata);

-- Update RLS policies to allow educators to manage their own molds
DROP POLICY IF EXISTS "educators_can_create_molds" ON public."GameMold";
DROP POLICY IF EXISTS "educators_can_update_own_molds" ON public."GameMold";
DROP POLICY IF EXISTS "educators_can_delete_own_molds" ON public."GameMold";

-- Allow educators to create molds
CREATE POLICY "educators_can_create_molds" ON public."GameMold"
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."EducatorAccount" 
      WHERE id = auth.uid()
    )
  );

-- Allow educators to update their own molds
CREATE POLICY "educators_can_update_own_molds" ON public."GameMold"
  FOR UPDATE 
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public."EducatorAccount" 
      WHERE id = auth.uid()
    )
  );

-- Allow educators to delete their own molds (if not in use)
CREATE POLICY "educators_can_delete_own_molds" ON public."GameMold"
  FOR DELETE 
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public."EducatorAccount" 
      WHERE id = auth.uid()
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public."PersonalizedMold" 
      WHERE mold_id = "GameMold".id
    )
  );

-- Grant necessary permissions for mold creation
GRANT INSERT, UPDATE, DELETE ON public."GameMold" TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public."Scene" TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public."Asset" TO authenticated;

-- Update the existing policy to include educator-created molds
DROP POLICY IF EXISTS "gamemold_select_policy" ON public."GameMold";

CREATE POLICY "gamemold_select_policy" ON public."GameMold"
  FOR SELECT 
  TO authenticated
  USING (
    -- Allow access to system molds (no created_by) or educator's own molds
    created_by IS NULL OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public."EducatorAccount" 
      WHERE id = auth.uid()
    )
  );

-- Add RLS policies for scenes and assets that belong to educator-created molds
ALTER TABLE public."Scene" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Asset" ENABLE ROW LEVEL SECURITY;

-- Scene policies
CREATE POLICY "scene_educator_access" ON public."Scene"
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."GameMold" 
      WHERE id = mold_id AND (
        created_by IS NULL OR 
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public."EducatorAccount" 
          WHERE id = auth.uid()
        )
      )
    )
  );

-- Asset policies  
CREATE POLICY "asset_educator_access" ON public."Asset"
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Scene" s
      JOIN public."GameMold" m ON s.mold_id = m.id
      WHERE s.id = scene_id AND (
        m.created_by IS NULL OR 
        m.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public."EducatorAccount" 
          WHERE id = auth.uid()
        )
      )
    )
  );

-- Update existing system molds to have NULL created_by (indicating system molds)
UPDATE public."GameMold" 
SET created_by = NULL 
WHERE created_by IS NOT NULL AND created_at < NOW() - INTERVAL '1 day';

-- Add helpful comments
COMMENT ON COLUMN public."GameMold".created_by IS 'ID of the educator who created this mold. NULL for system-provided molds.';
COMMENT ON COLUMN public."GameMold".metadata IS 'Structured metadata including learning objectives, difficulty, target profiles, etc.';

-- Create function to validate mold ownership for API calls
CREATE OR REPLACE FUNCTION check_mold_ownership(mold_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."GameMold" 
    WHERE id = mold_id AND (created_by = user_id OR created_by IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
