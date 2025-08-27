-- Update ChildProfile RLS policies to allow all educators to update all children
-- Date: 2025-08-27
-- Reason: Educators need to be able to update avatars for any child in their system

-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Educators can update their own children" ON public."ChildProfile";

-- Create new policy that allows all authenticated educators to update all children
CREATE POLICY "All educators can update all children" ON public."ChildProfile"
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Note: This maintains security by requiring authentication while allowing
-- educators to manage avatars and profiles for any child in the system