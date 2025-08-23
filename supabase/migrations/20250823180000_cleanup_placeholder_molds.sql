-- Clean up mold library: Remove placeholder games, keep only working implementations
-- This removes non-functional game types and keeps only fully implemented ones

-- Remove placeholder game types that only have UI placeholders
DELETE FROM public."Scene" WHERE mold_id IN (
  '33333333-3333-3333-3333-333333333333', -- Puzzle game
  '44444444-4444-4444-4444-444444444444', -- Drawing game  
  '55555555-5555-5555-5555-555555555555'  -- Storytelling game
);

DELETE FROM public."GameMold" WHERE id IN (
  '33333333-3333-3333-3333-333333333333', -- Picture Puzzle Adventure (placeholder)
  '44444444-4444-4444-4444-444444444444', -- Creative Drawing Studio (placeholder)
  '55555555-5555-5555-5555-555555555555'  -- Interactive Story Builder (placeholder)
);

-- Update comment to reflect current state
COMMENT ON TABLE public."GameMold" IS 'Immutable game templates. Currently implemented: matching (card memory game), sorting (categorization game). Future: puzzle, drawing, storytelling games.';
