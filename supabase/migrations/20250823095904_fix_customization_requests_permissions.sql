-- Fix MoldCustomizationRequest permissions for anonymous users

-- First, disable RLS temporarily to clear existing policies
ALTER TABLE public."MoldCustomizationRequest" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for this table
DROP POLICY IF EXISTS "Public read access to customization requests" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "Public write access to customization requests" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "Public update access to customization requests" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "custom_req_select_child" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "custom_req_insert_child" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "custom_req_select_educator" ON public."MoldCustomizationRequest";

-- Re-enable RLS
ALTER TABLE public."MoldCustomizationRequest" ENABLE ROW LEVEL SECURITY;

-- Create new comprehensive policies for anonymous and authenticated users
CREATE POLICY "Allow all access to customization requests" ON public."MoldCustomizationRequest"
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE ON public."MoldCustomizationRequest" TO anon;
GRANT SELECT, INSERT, UPDATE ON public."MoldCustomizationRequest" TO authenticated;
