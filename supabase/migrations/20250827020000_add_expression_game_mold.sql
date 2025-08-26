-- Add Expression Recognition Game mold to match the existing ExpressionGame.tsx component
-- This game uses facial expression detection to help children learn about emotions

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
  'Expression Recognition Challenge',
  'Emotional Learning',
  'camera-based',
  'expression',
  'Develop emotional intelligence through facial expression recognition',
  '{
    "expressions": ["happy", "sad", "angry", "surprised"],
    "detection_threshold": 0.7,
    "practice_rounds": 4,
    "quiz_questions": 8,
    "time_per_expression": 10,
    "baseline_calibration": true,
    "camera_required": true,
    "scoring": {
      "detection_points": 20,
      "quiz_points": 10,
      "accuracy_bonus": 15,
      "time_bonus": 5
    },
    "feedback": {
      "positive": ["Great expression!", "Perfect emotion!", "You got it!"],
      "negative": ["Try again!", "Show me that feeling!", "Almost there!"],
      "encouragement": ["You are doing amazing!", "Keep expressing!", "Show me your emotions!"]
    }
  }',
  true,  -- lock_structure: expression detection system is fixed
  false, -- allow_themes: expressions are standardized
  true,  -- allow_pacing: timing can be adjusted for different abilities
  true,  -- allow_rewards: success feedback can be personalized
  false, -- allow_avatars: uses real camera feed
  'This game helps children learn to recognize and express emotions. Great for emotional development and social skills. Requires camera access.',
  4,
  12,
  1
);

-- Add scenes for the expression game
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
  'Expression Practice',
  'Practice showing different emotions to the camera',
  '{
    "type": "practice",
    "instructions": "Look at the camera and show the emotion that appears on screen",
    "expressions_to_practice": ["happy", "sad", "angry", "surprised"],
    "detection_required": true,
    "skip_allowed": false
  }'
);

INSERT INTO public."Scene" (
  mold_id,
  scene_index,
  name,
  description,
  config
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  2,
  'Emotion Recognition Quiz',
  'Look at pictures and identify the emotions',
  '{
    "type": "quiz",
    "instructions": "Look at each face and choose the emotion you see",
    "quiz_images": [
      "/expressions/happy.jpg",
      "/expressions/sad.jpg", 
      "/expressions/angry.jpeg",
      "/expressions/surprised.jpeg"
    ],
    "multiple_choice": true,
    "options": ["happy", "sad", "angry", "surprised"]
  }'
);

-- Comment on the new mold
COMMENT ON TABLE public."GameMold" IS 'Game templates including facial expression recognition for emotional learning';
