-- Add diverse game mold types to demonstrate polymorphic AI generation system
-- Each mold type will require different AI prompts and generation strategies

-- 1. Sorting Game Example
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
  '22222222-2222-2222-2222-222222222222',
  'Category Sorting Challenge',
  'Logic & Learning',
  'category-based',
  'sorting',
  'Develop categorization skills and logical thinking',
  '{
    "categories_count": 3,
    "items_per_category": 4,
    "difficulty_levels": ["easy", "medium", "hard"],
    "scoring": {
      "correct_sort": 10,
      "wrong_sort": -2,
      "time_bonus": true
    },
    "feedback": {
      "positive": ["Great sorting!", "Perfect match!", "You got it!"],
      "negative": ["Try again!", "Almost there!", "Think about it!"]
    }
  }',
  true,  -- lock_structure: category system is fixed
  true,  -- allow_themes: items and categories can be themed
  true,  -- allow_pacing: timing can be adjusted
  true,  -- allow_rewards: success feedback can be personalized
  false, -- allow_avatars: not relevant for sorting
  'Children can personalize the items to sort. Popular themes: animals by habitat, food by type, toys by category, colors by shade.',
  3,
  10,
  1
);

-- 2. Simple Puzzle Game Example
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
  '33333333-3333-3333-3333-333333333333',
  'Picture Puzzle Adventure',
  'Visual & Spatial',
  'grid-based',
  'puzzle',
  'Enhance spatial reasoning and visual problem-solving',
  '{
    "piece_count": 12,
    "grid_size": "4x3",
    "difficulty_levels": ["6-piece", "12-piece", "24-piece"],
    "hint_system": true,
    "auto_sort_pieces": false,
    "scoring": {
      "completion_points": 50,
      "time_bonus": true,
      "hint_penalty": -5
    }
  }',
  true,  -- lock_structure: puzzle mechanics are fixed
  true,  -- allow_themes: main image can be personalized
  true,  -- allow_pacing: can adjust hint timing
  true,  -- allow_rewards: completion celebrations can be themed
  false, -- allow_avatars: not relevant for puzzles
  'Children can choose the main puzzle image. Popular themes: favorite pets, family photos, cartoon characters, nature scenes.',
  4,
  12,
  1
);

-- 3. Drawing/Creative Game Example
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
  '44444444-4444-4444-4444-444444444444',
  'Creative Drawing Studio',
  'Art & Expression',
  'canvas-based',
  'drawing',
  'Foster creativity and artistic expression',
  '{
    "canvas_size": {"width": 800, "height": 600},
    "drawing_prompts": 5,
    "tool_set": ["pencil", "brush", "crayon", "marker"],
    "color_palette": "full",
    "save_artwork": true,
    "sharing_enabled": false,
    "scoring": {
      "completion_points": 25,
      "creativity_bonus": 15
    }
  }',
  false, -- lock_structure: can add different tools
  true,  -- allow_themes: drawing prompts can be themed
  true,  -- allow_pacing: can adjust prompt timing
  true,  -- allow_rewards: can personalize encouragement
  true,  -- allow_avatars: can add character guides
  'Children can get personalized drawing prompts. Popular themes: draw your pets, family members, dream house, favorite activities.',
  4,
  15,
  1
);

-- 4. Storytelling Game Example
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
  '55555555-5555-5555-5555-555555555555',
  'Interactive Story Builder',
  'Language & Narrative',
  'sequence-based',
  'storytelling',
  'Develop language skills and narrative thinking',
  '{
    "story_structure": "beginning-middle-end",
    "characters_count": 3,
    "scene_count": 3,
    "choice_points": 2,
    "record_voice": false,
    "text_input": true,
    "story_length": "short",
    "scoring": {
      "story_completion": 30,
      "creativity_bonus": 20
    }
  }',
  true,  -- lock_structure: story format is fixed
  true,  -- allow_themes: characters and settings can be themed
  true,  -- allow_pacing: can adjust story pace
  true,  -- allow_rewards: can personalize story celebrations
  true,  -- allow_avatars: characters can be personalized
  'Children can create stories with personalized characters and settings. Popular themes: family adventures, pet stories, superhero tales, fairy tale remixes.',
  5,
  12,
  1
);

-- Add scenes for the sorting game
INSERT INTO public."Scene" (
  mold_id,
  scene_index,
  name,
  description,
  config
) VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  1,
  'Sorting Setup',
  'Initialize categories and items to sort',
  '{
    "type": "setup",
    "layout": "horizontal-categories",
    "category_slots": 3,
    "item_pool_position": "bottom",
    "drag_and_drop": true,
    "mobile_friendly": true
  }'
),
(
  '22222222-2222-2222-2222-222222222222',
  2,
  'Sorting Gameplay',
  'Main sorting interaction and feedback',
  '{
    "type": "gameplay",
    "interactions": ["drag_item", "drop_item", "category_feedback"],
    "feedback_timing": "immediate",
    "visual_cues": {
      "correct_drop": "green_highlight",
      "incorrect_drop": "red_shake",
      "category_hover": "blue_glow"
    }
  }'
);

-- Add scenes for the puzzle game
INSERT INTO public."Scene" (
  mold_id,
  scene_index,
  name,
  description,
  config
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  1,
  'Puzzle Setup',
  'Display complete image then scramble pieces',
  '{
    "type": "setup",
    "preview_time": 5,
    "scramble_animation": true,
    "piece_distribution": "random",
    "workspace_layout": "side-by-side"
  }'
),
(
  '33333333-3333-3333-3333-333333333333',
  2,
  'Puzzle Assembly',
  'Main puzzle-solving interaction',
  '{
    "type": "gameplay",
    "interactions": ["piece_selection", "piece_placement", "auto_snap"],
    "hint_system": {
      "edge_pieces_first": true,
      "corner_highlights": true,
      "show_ghost_outline": false
    }
  }'
);

-- Comment on the polymorphic nature of these molds
COMMENT ON TABLE public."GameMold" IS 'Immutable game templates. Each experience_type requires different AI generation strategies: matching=card content, sorting=categorized items, puzzle=main image, drawing=prompt themes, storytelling=characters+settings.';
