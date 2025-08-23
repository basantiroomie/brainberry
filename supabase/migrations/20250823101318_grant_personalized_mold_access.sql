-- Grant INSERT and SELECT permissions on PersonalizedMold table to anonymous users (children)
GRANT INSERT, SELECT ON public."PersonalizedMold" TO anon;

-- Allow children to read their own personalized molds
CREATE POLICY "Children can read their own personalized molds" ON public."PersonalizedMold"
  FOR SELECT USING (true);

-- Allow children to create personalized molds
CREATE POLICY "Children can create personalized molds" ON public."PersonalizedMold"
  FOR INSERT WITH CHECK (true);
