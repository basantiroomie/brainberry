-- Child Personalization Support & Immutable Molds
-- This migration introduces tables that allow a child-specific personalized instance
-- of an immutable developer-authored GameMold. The original GameMold rows remain
-- read-only to all (except service role) and personalization data references them.

-- 1. Enforce immutability (revoke writes from authenticated/anon)
REVOKE INSERT, UPDATE, DELETE ON public."GameMold" FROM anon, authenticated;

-- Optional: create a role for internal seeding if desired (commented out)
-- CREATE ROLE mold_admin NOINHERIT;
-- GRANT SELECT ON public."GameMold" TO mold_admin;

-- 2. Personalized game instance (a concrete customized copy the child plays)
CREATE TABLE IF NOT EXISTS public."PersonalizedMold" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public."ChildProfile"(id) ON DELETE CASCADE,
  mold_id uuid REFERENCES public."GameMold"(id) ON DELETE CASCADE,
  title text, -- child-chosen display name
  config jsonb NOT NULL DEFAULT '{}'::jsonb, -- full resolved playable configuration
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Raw customization intents (inputs prompting GenAI image/text generation)
CREATE TABLE IF NOT EXISTS public."MoldCustomizationRequest" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public."ChildProfile"(id) ON DELETE CASCADE,
  mold_id uuid REFERENCES public."GameMold"(id) ON DELETE CASCADE,
  personalization_id uuid REFERENCES public."PersonalizedMold"(id) ON DELETE CASCADE,
  prompt text NOT NULL, -- free-form textual description (favorite animals, family, etc.)
  target jsonb NOT NULL, -- which parts of mold (cards, scenes, assets)
  status text NOT NULL DEFAULT 'pending', -- pending | generating | complete | failed
  result jsonb, -- generated assets metadata (urls, alt text, etc.)
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public."PersonalizedMold" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MoldCustomizationRequest" ENABLE ROW LEVEL SECURITY;

-- Children (anon session using access code flow) can read/create only their rows.
CREATE POLICY "personalized_mold_select_child" ON public."PersonalizedMold"
  FOR SELECT USING (auth.uid() IS NOT NULL AND child_id IN (SELECT id FROM public."ChildProfile" WHERE educator_id IS NOT NULL));

CREATE POLICY "personalized_mold_insert_child" ON public."PersonalizedMold"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "custom_req_select_child" ON public."MoldCustomizationRequest"
  FOR SELECT USING (auth.uid() IS NOT NULL AND child_id IN (SELECT id FROM public."ChildProfile"));

CREATE POLICY "custom_req_insert_child" ON public."MoldCustomizationRequest"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Educators can view child personalization belonging to their children
CREATE POLICY "personalized_mold_select_educator" ON public."PersonalizedMold"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT ea.id FROM public."EducatorAccount" ea
      JOIN public."ChildProfile" cp ON cp.educator_id = ea.id
      WHERE cp.id = child_id
    )
  );

CREATE POLICY "custom_req_select_educator" ON public."MoldCustomizationRequest"
  FOR SELECT USING (
    auth.uid() IN (
      SELECT ea.id FROM public."EducatorAccount" ea
      JOIN public."ChildProfile" cp ON cp.educator_id = ea.id
      WHERE cp.id = child_id
    )
  );

-- 5. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_personalized_mold_child ON public."PersonalizedMold"(child_id);
CREATE INDEX IF NOT EXISTS idx_personalized_mold_mold ON public."PersonalizedMold"(mold_id);
CREATE INDEX IF NOT EXISTS idx_custom_req_child ON public."MoldCustomizationRequest"(child_id);
CREATE INDEX IF NOT EXISTS idx_custom_req_status ON public."MoldCustomizationRequest"(status);

-- 6. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_personalized_mold
  BEFORE UPDATE ON public."PersonalizedMold"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_touch_custom_req
  BEFORE UPDATE ON public."MoldCustomizationRequest"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Comment documentation
COMMENT ON TABLE public."PersonalizedMold" IS 'A persisted playable customized version of an immutable GameMold for a specific child.';
COMMENT ON TABLE public."MoldCustomizationRequest" IS 'Tracks GenAI-assisted customization intents and generated assets for a child-specific personalized mold.';
