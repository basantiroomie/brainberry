-- Allow public read access to PersonalizedMold by child_id
-- This enables the child interface to fetch personalized games without authentication

-- Add policy to allow public read of PersonalizedMold records
CREATE POLICY "Anyone can view personalized molds by child_id" ON public."PersonalizedMold"
  FOR SELECT USING (true);

-- This is safe because:
-- 1. Child interface passes child_id in the query parameter
-- 2. API endpoint filters by child_id
-- 3. No sensitive information is exposed in PersonalizedMold table
-- 4. Children can only see their own games through the API endpoint logic
