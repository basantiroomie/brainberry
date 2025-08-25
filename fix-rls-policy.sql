-- SQL to update RLS policy for ChildProfile table
-- This will allow all authenticated users to read all children

-- Connect to your Supabase project and run this SQL in the SQL editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Educators can view their own children" ON public."ChildProfile";

-- Create new policy that allows all authenticated users to view all children
CREATE POLICY "All authenticated users can view all children" ON public."ChildProfile"
    FOR SELECT USING (auth.uid() IS NOT NULL);
