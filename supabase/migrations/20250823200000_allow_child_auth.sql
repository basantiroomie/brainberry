-- Add RLS policy to allow anonymous users to access children by access code for authentication
CREATE POLICY "Anonymous users can access children by access code" ON public."ChildProfile"
    FOR SELECT 
    TO anon
    USING (true); -- Allow access to any child for access code validation
