-- Remove Expression Recognition Challenge game mold
-- This removes the specific mold with ID '33333333-3333-3333-3333-333333333333'
-- while keeping the Expression Game component intact

-- First, delete any scenes associated with this mold (if Scene table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Scene' AND table_schema = 'public') THEN
        DELETE FROM public."Scene" 
        WHERE mold_id = '33333333-3333-3333-3333-333333333333';
    END IF;
END $$;

-- Delete any personalized games based on this mold (if PersonalizedGame table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'PersonalizedGame' AND table_schema = 'public') THEN
        DELETE FROM public."PersonalizedGame" 
        WHERE mold_id = '33333333-3333-3333-3333-333333333333';
    END IF;
END $$;

-- Finally, delete the mold itself (if GameMold table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'GameMold' AND table_schema = 'public') THEN
        DELETE FROM public."GameMold" 
        WHERE id = '33333333-3333-3333-3333-333333333333' 
        AND name = 'Expression Recognition Challenge';
    END IF;
END $$;
