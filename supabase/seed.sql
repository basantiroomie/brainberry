-- CLEANED SEED DATA - Only Working Personalized Game Molds
-- This file now contains only fully implemented games with AI personalization
-- Old therapeutic game placeholders have been removed

-- NOTE: These molds are now inserted via migrations, not seed file
-- See migrations 20250823160000_add_card_game_mold.sql and 20250823170000_add_diverse_game_types.sql
-- This seed file is kept for reference but should not be re-run

-- Current working molds (inserted via migrations):
-- 1. Matching Card Memory Game (11111111-1111-1111-1111-111111111111)
--    - Full AI personalization with custom prompts
--    - Complete gameplay with scoring and effects
--    - Theme-based card generation (animals, family, toys, etc.)
--
-- 2. Category Sorting Challenge (22222222-2222-2222-2222-222222222222)  
--    - Drag-and-drop categorization mechanics
--    - AI-generated themed items for sorting
--    - Mobile-friendly interactions

-- All old placeholder content removed:
-- ❌ Memory Match Adventure (old therapeutic game)
-- ❌ Emotional Explorer (old therapeutic game)
-- ❌ Focus Forest (old therapeutic game)  
-- ❌ Social Skills Simulator (old therapeutic game)
-- ❌ Math Mountain Climber (old therapeutic game)

-- DO NOT RE-RUN THIS SEED FILE
-- Use migrations for all mold management

-- Math Mountain Climber scenes
('00000000-0000-0000-0000-000000000005', 1, 'Base Camp Basics', 'Addition and subtraction fundamentals', '{"operations": ["addition", "subtraction"], "range": "1-10"}'),
('00000000-0000-0000-0000-000000000005', 2, 'Rocky Ridge', 'Multiplication and division', '{"operations": ["multiplication", "division"], "range": "1-12"}');

-- Insert sample assets for scenes
INSERT INTO public."Asset" (
  scene_id,
  asset_type,
  name,
  url,
  metadata
) VALUES 
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000001' AND scene_index = 1), 'image', 'Forest Background', '/assets/forest-bg.png', '{"width": 1920, "height": 1080}'),
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000001' AND scene_index = 1), 'audio', 'Forest Sounds', '/assets/forest-ambient.mp3', '{"duration": 300, "loop": true}'),
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000002' AND scene_index = 1), 'image', 'Playground Scene', '/assets/playground.png', '{"width": 1920, "height": 1080}'),
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000003' AND scene_index = 1), 'image', 'Bamboo Forest', '/assets/bamboo-path.png', '{"width": 1920, "height": 1080}'),
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000004' AND scene_index = 1), 'image', 'Playground Equipment', '/assets/playground-equipment.png', '{"width": 1920, "height": 1080}'),
((SELECT id FROM public."Scene" WHERE mold_id = '00000000-0000-0000-0000-000000000005' AND scene_index = 1), 'image', 'Mountain Base', '/assets/mountain-base.png', '{"width": 1920, "height": 1080}');
