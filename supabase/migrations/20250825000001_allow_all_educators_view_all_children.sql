-- Update ChildProfile RLS policies to allow all educators to view all children
-- Date: 2025-08-25

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Educators can view their own children" ON public."ChildProfile";

-- Create new policy that allows all authenticated educators to view all children
CREATE POLICY "All educators can view all children" ON public."ChildProfile"
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Keep the other policies restrictive (insert/update/delete still requires ownership)
-- This ensures data integrity while allowing read access to all children
