-- Fresh seed data for educator-focused application
-- Inserts therapeutic game molds for educators to assign to children

INSERT INTO public."GameMold" (
  id,
  name,
  category,
  structure_type,
  experience_type,
  primary_objective,
  rules,
  customization_notes,
  age_min,
  age_max
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  'Memory Match Adventure',
  'Cognitive Training',
  'Match-3',
  'Single Player',
  'Improve working memory and pattern recognition',
  '{"difficulty_levels": ["easy", "medium", "hard"], "time_limit": 60, "lives": 3}',
  'Adjust difficulty based on child''s attention span. Use familiar themes.',
  4,
  12
),
(
  '00000000-0000-0000-0000-000000000002',
  'Emotional Explorer',
  'Social-Emotional Learning',
  'Story-driven',
  'Interactive Story',
  'Develop emotional recognition and regulation skills',
  '{"scenarios": ["happy", "sad", "angry", "afraid"], "choices": 3, "feedback": true}',
  'Customize scenarios to match child''s experiences. Include positive coping strategies.',
  5,
  10
),
(
  '00000000-0000-0000-0000-000000000003',
  'Focus Forest',
  'Attention Training',
  'Endless Runner',
  'Single Player',
  'Improve sustained attention and impulse control',
  '{"duration": 300, "distractors": true, "rewards": "badges", "breaks": 60}',
  'Start with shorter sessions for ADHD children. Gradually increase duration.',
  6,
  14
),
(
  '00000000-0000-0000-0000-000000000004',
  'Social Skills Simulator',
  'Social Skills',
  'Role-Playing',
  'Multi-scenario',
  'Practice social interactions and communication',
  '{"situations": ["playground", "classroom", "home"], "difficulty": "adaptive"}',
  'Focus on specific social challenges. Use video modeling for autism spectrum.',
  7,
  16
),
(
  '00000000-0000-0000-0000-000000000005',
  'Math Mountain Climber',
  'Academic Support',
  'Adventure',
  'Level-based',
  'Reinforce mathematical concepts through gameplay',
  '{"operations": ["addition", "subtraction", "multiplication"], "adaptive": true}',
  'Align with IEP math goals. Use visual supports for dyscalculia.',
  8,
  15
);

-- Insert scenes for each game mold
INSERT INTO public."Scene" (
  mold_id,
  scene_index,
  name,
  description,
  config
) VALUES 
-- Memory Match Adventure scenes
('00000000-0000-0000-0000-000000000001', 1, 'Forest Clearing', 'Introduction to matching mechanics', '{"grid_size": "3x3", "theme": "animals"}'),
('00000000-0000-0000-0000-000000000001', 2, 'Enchanted Garden', 'Medium difficulty matching', '{"grid_size": "4x4", "theme": "flowers"}'),
('00000000-0000-0000-0000-000000000001', 3, 'Treasure Cave', 'Advanced matching challenges', '{"grid_size": "5x5", "theme": "gems"}'),

-- Emotional Explorer scenes  
('00000000-0000-0000-0000-000000000002', 1, 'Playground Feelings', 'Recognizing emotions in social settings', '{"scenario": "recess", "emotions": ["happy", "excited", "nervous"]}'),
('00000000-0000-0000-0000-000000000002', 2, 'Classroom Challenges', 'Managing difficult emotions', '{"scenario": "test", "emotions": ["worried", "frustrated", "proud"]}'),

-- Focus Forest scenes
('00000000-0000-0000-0000-000000000003', 1, 'Bamboo Path', 'Basic attention training', '{"obstacles": "low", "duration": 60, "theme": "nature"}'),
('00000000-0000-0000-0000-000000000003', 2, 'Mountain Trail', 'Advanced focus challenges', '{"obstacles": "high", "duration": 120, "theme": "adventure"}'),

-- Social Skills Simulator scenes
('00000000-0000-0000-0000-000000000004', 1, 'Playground Practice', 'Learning to join activities', '{"setting": "playground", "difficulty": "beginner"}'),
('00000000-0000-0000-0000-000000000004', 2, 'Classroom Conversations', 'Appropriate communication in class', '{"setting": "classroom", "difficulty": "intermediate"}'),

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
