-- Allow public access to MoldCustomizationRequest table for anonymous users (children)

-- Drop existing RLS policies for MoldCustomizationRequest if they exist
DROP POLICY IF EXISTS "Children can view customization requests" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "Children can create customization requests" ON public."MoldCustomizationRequest";
DROP POLICY IF EXISTS "Children can update their customization requests" ON public."MoldCustomizationRequest";

-- Create new policies for MoldCustomizationRequest
CREATE POLICY "Public read access to customization requests" ON public."MoldCustomizationRequest"
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public write access to customization requests" ON public."MoldCustomizationRequest"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Public update access to customization requests" ON public."MoldCustomizationRequest"
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure the table has RLS enabled
ALTER TABLE public."MoldCustomizationRequest" ENABLE ROW LEVEL SECURITY;
