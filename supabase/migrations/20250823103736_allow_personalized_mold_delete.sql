-- Allow DELETE operations on PersonalizedMold table for anonymous users (children)
GRANT DELETE ON public."PersonalizedMold" TO anon;

-- Allow children to delete their own personalized molds
CREATE POLICY "Children can delete their own personalized molds" ON public."PersonalizedMold"
  FOR DELETE USING (true);
