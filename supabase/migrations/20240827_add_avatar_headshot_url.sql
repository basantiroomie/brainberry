-- Add avatar_headshot_url column to ChildProfile table
ALTER TABLE "ChildProfile" 
ADD COLUMN IF NOT EXISTS "avatar_headshot_url" TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN "ChildProfile"."avatar_headshot_url" IS 'URL to the generated headshot/profile picture from the 3D avatar';

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Educators can update child profiles" ON "ChildProfile";

CREATE POLICY "Educators can update child profiles" ON "ChildProfile"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Educator" 
            WHERE "Educator"."user_id" = auth.uid()
        )
    );

-- Ensure the column is included in existing policies
DROP POLICY IF EXISTS "Educators can view all child profiles" ON "ChildProfile";

CREATE POLICY "Educators can view all child profiles" ON "ChildProfile"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Educator" 
            WHERE "Educator"."user_id" = auth.uid()
        )
    );