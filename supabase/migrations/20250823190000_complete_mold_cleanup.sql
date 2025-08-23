-- Complete cleanup: Remove all old/fake molds, keep only working personalized game molds
-- This removes the old therapeutic game templates from seed.sql and other sources
-- Keeps only the fully functional personalized game system

-- First, remove all scenes for old molds
DELETE FROM public."Scene" WHERE mold_id IN (
  '00000000-0000-0000-0000-000000000001', -- Memory Match Adventure (old therapeutic)
  '00000000-0000-0000-0000-000000000002', -- Emotional Explorer (old therapeutic)
  '00000000-0000-0000-0000-000000000003', -- Focus Forest (old therapeutic)
  '00000000-0000-0000-0000-000000000004', -- Social Skills Simulator (old therapeutic)
  '00000000-0000-0000-0000-000000000005', -- Math Mountain Climber (old therapeutic)
  '33333333-3333-3333-3333-333333333333', -- Picture Puzzle Adventure (placeholder)
  '44444444-4444-4444-4444-444444444444', -- Creative Drawing Studio (placeholder)
  '55555555-5555-5555-5555-555555555555'  -- Interactive Story Builder (placeholder)
);

-- Remove all old/fake game molds
DELETE FROM public."GameMold" WHERE id IN (
  '00000000-0000-0000-0000-000000000001', -- Memory Match Adventure (old therapeutic)
  '00000000-0000-0000-0000-000000000002', -- Emotional Explorer (old therapeutic)
  '00000000-0000-0000-0000-000000000003', -- Focus Forest (old therapeutic)
  '00000000-0000-0000-0000-000000000004', -- Social Skills Simulator (old therapeutic)
  '00000000-0000-0000-0000-000000000005', -- Math Mountain Climber (old therapeutic)
  '33333333-3333-3333-3333-333333333333', -- Picture Puzzle Adventure (placeholder)
  '44444444-4444-4444-4444-444444444444', -- Creative Drawing Studio (placeholder)
  '55555555-5555-5555-5555-555555555555'  -- Interactive Story Builder (placeholder)
);

-- Verify we only have the working molds left
-- Should only contain:
-- - '11111111-1111-1111-1111-111111111111' (Matching Card Memory Game)
-- - '22222222-2222-2222-2222-222222222222' (Category Sorting Challenge)

-- Update comment to reflect cleaned state
COMMENT ON TABLE public."GameMold" IS 'Immutable game templates with full AI personalization. Only contains fully implemented games: matching cards (memory game) and sorting (categorization). All placeholder/fake content removed.';
