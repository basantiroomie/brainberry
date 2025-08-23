-- Drop existing conflicting policies first and recreate them properly
DROP POLICY IF EXISTS "Anonymous users can view assignments for any child" ON public."MoldAssignment";
DROP POLICY IF EXISTS "Anonymous users can view sessions for any child" ON public."GameSession";

-- Create new policies to allow anonymous users (children) to access their data
CREATE POLICY "Children can view all assignments" ON public."MoldAssignment"
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Children can view all sessions" ON public."GameSession"
    FOR SELECT 
    TO anon  
    USING (true);
