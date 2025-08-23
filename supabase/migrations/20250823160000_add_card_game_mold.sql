-- Add a detailed Matching Card Game mold as an example of the immutable template system
-- This demonstrates how a mold defines the structure while allowing personalization

INSERT INTO public."GameMold" (
  id,
  name,
  category,
  structure_type,
  experience_type,
  primary_objective,
  rules,
  lock_structure,
  allow_themes,
  allow_pacing,
  allow_rewards,
  allow_avatars,
  customization_notes,
  age_min,
  age_max,
  version
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Matching Card Memory Game',
  'Memory & Cognition',
  'grid-based',
  'matching',
  'Improve visual memory and pattern recognition through card matching',
  '{
    "grid_size": "4x4",
    "total_cards": 16,
    "pairs_count": 8,
    "max_attempts": 3,
    "time_limit_seconds": 180,
    "reveal_time_ms": 1500,
    "card_flip_animation": "flip",
    "success_criteria": "match_all_pairs",
    "difficulty_levels": ["easy", "medium", "hard"],
    "scoring": {
      "match_points": 10,
      "time_bonus": true,
      "attempt_penalty": -2
    }
  }',
  true,  -- lock_structure: grid and rules are fixed
  true,  -- allow_themes: images and text can be customized
  true,  -- allow_pacing: timing can be adjusted
  true,  -- allow_rewards: success animations/sounds can be personalized
  false, -- allow_avatars: not relevant for this game type
  'Children can personalize card images and text. Popular themes: animals, family photos, favorite toys, cartoon characters. Adjust timing based on attention span.',
  3,
  12,
  1
);

-- Add scenes that define the card game structure
INSERT INTO public."Scene" (
  mold_id,
  scene_index,
  name,
  description,
  config
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  1,
  'Game Setup',
  'Initial card layout and game introduction',
  '{
    "type": "setup",
    "grid_layout": "4x4",
    "card_positions": [
      {"x": 0, "y": 0, "pair_id": 1},
      {"x": 1, "y": 0, "pair_id": 2},
      {"x": 2, "y": 0, "pair_id": 3},
      {"x": 3, "y": 0, "pair_id": 4},
      {"x": 0, "y": 1, "pair_id": 5},
      {"x": 1, "y": 1, "pair_id": 6},
      {"x": 2, "y": 1, "pair_id": 7},
      {"x": 3, "y": 1, "pair_id": 8},
      {"x": 0, "y": 2, "pair_id": 1},
      {"x": 1, "y": 2, "pair_id": 2},
      {"x": 2, "y": 2, "pair_id": 3},
      {"x": 3, "y": 2, "pair_id": 4},
      {"x": 0, "y": 3, "pair_id": 5},
      {"x": 1, "y": 3, "pair_id": 6},
      {"x": 2, "y": 3, "pair_id": 7},
      {"x": 3, "y": 3, "pair_id": 8}
    ],
    "shuffle_on_start": true
  }'
),
(
  '11111111-1111-1111-1111-111111111111',
  2,
  'Game Play',
  'Main matching gameplay mechanics',
  '{
    "type": "gameplay",
    "interactions": ["card_flip", "match_check", "score_update"],
    "feedback": {
      "match_success": "positive_animation",
      "match_failure": "gentle_shake",
      "game_complete": "celebration"
    },
    "customizable_elements": [
      "card_front_images",
      "card_back_design",
      "match_sounds",
      "background_music",
      "success_messages"
    ]
  }'
),
(
  '11111111-1111-1111-1111-111111111111',
  3,
  'Game Complete',
  'End game celebration and results',
  '{
    "type": "completion",
    "show_statistics": true,
    "stats_displayed": ["time_taken", "attempts_used", "matches_found", "final_score"],
    "celebration_options": ["confetti", "stars", "applause"],
    "replay_option": true,
    "customizable_elements": [
      "celebration_animation",
      "success_message",
      "replay_button_text"
    ]
  }'
);

-- Add default template assets (these will be replaced during personalization)
INSERT INTO public."Asset" (
  scene_id,
  asset_type,
  name,
  url,
  metadata
) VALUES 
-- Setup scene assets
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Back Template',
  '/assets/templates/card-back-default.png',
  '{"width": 120, "height": 160, "customizable": false, "description": "Default card back design"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 1',
  '/assets/templates/placeholder-1.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 1, "description": "Customizable card image for pair 1"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 2',
  '/assets/templates/placeholder-2.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 2, "description": "Customizable card image for pair 2"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 3',
  '/assets/templates/placeholder-3.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 3, "description": "Customizable card image for pair 3"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 4',
  '/assets/templates/placeholder-4.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 4, "description": "Customizable card image for pair 4"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 5',
  '/assets/templates/placeholder-5.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 5, "description": "Customizable card image for pair 5"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 6',
  '/assets/templates/placeholder-6.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 6, "description": "Customizable card image for pair 6"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 7',
  '/assets/templates/placeholder-7.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 7, "description": "Customizable card image for pair 7"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 1),
  'image',
  'Card Template 8',
  '/assets/templates/placeholder-8.png',
  '{"width": 120, "height": 160, "customizable": true, "pair_id": 8, "description": "Customizable card image for pair 8"}'
),
-- Gameplay scene assets
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 2),
  'audio',
  'Match Success Sound',
  '/assets/audio/match-success.mp3',
  '{"duration": 1.5, "customizable": true, "description": "Sound played when cards match"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 2),
  'audio',
  'Match Failure Sound',
  '/assets/audio/match-failure.mp3',
  '{"duration": 1.0, "customizable": true, "description": "Sound played when cards don''t match"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 2),
  'audio',
  'Background Music',
  '/assets/audio/gameplay-bg.mp3',
  '{"duration": 120, "loop": true, "customizable": true, "description": "Background music during gameplay"}'
),
-- Completion scene assets
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 3),
  'animation',
  'Success Celebration',
  '/assets/animations/confetti.json',
  '{"type": "lottie", "customizable": true, "description": "Celebration animation for game completion"}'
),
(
  (SELECT id FROM public."Scene" WHERE mold_id = '11111111-1111-1111-1111-111111111111' AND scene_index = 3),
  'audio',
  'Victory Sound',
  '/assets/audio/victory.mp3',
  '{"duration": 3.0, "customizable": true, "description": "Sound played when game is completed"}'
);

-- Update the Scene table to match our current schema (if needed)
-- Note: This assumes the Scene table has mold_id, scene_index, name, description, config columns
-- Adjust column names if they differ in your actual schema
