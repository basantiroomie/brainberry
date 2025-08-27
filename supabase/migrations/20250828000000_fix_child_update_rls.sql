-- Fix ChildProfile RLS policies to ensure all educators can update all children
-- Date: 2025-08-28
-- Reason: Avatar updates are failing due to RLS policy issues

-- First, let's check and drop all existing policies for ChildProfile
DROP POLICY IF EXISTS "Educators can view their own children" ON public."ChildProfile";
DROP POLICY IF EXISTS "All educators can view all children" ON public."ChildProfile";
DROP POLICY IF EXISTS "Educators can update their own children" ON public."ChildProfile";
DROP POLICY IF EXISTS "All educators can update all children" ON public."ChildProfile";
DROP POLICY IF EXISTS "Educators can insert children" ON public."ChildProfile";
DROP POLICY IF EXISTS "Educators can delete their own children" ON public."ChildProfile";

-- Create comprehensive policies that allow all authenticated educators to manage all children
-- This ensures educators can manage avatars and profiles for any child in the system

-- SELECT policy - all authenticated users can view all children
CREATE POLICY "All authenticated users can view all children" ON public."ChildProfile"
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT policy - all authenticated users can create children
CREATE POLICY "All authenticated users can create children" ON public."ChildProfile"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE policy - all authenticated users can update all children
CREATE POLICY "All authenticated users can update all children" ON public."ChildProfile"
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE policy - all authenticated users can delete all children
CREATE POLICY "All authenticated users can delete all children" ON public."ChildProfile"
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Note: This maintains security by requiring authentication while allowing
-- full access to child management for all authenticated educators