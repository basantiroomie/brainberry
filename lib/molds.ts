// Types and local persistence utilities for Game Molds (therapist-created templates)
// These are intentionally simple (localStorage) until a backend API is wired in.

export type LearnerProfile = 'ASD' | 'ADHD' | 'HYBRID'

export type GameStructureType = 'linear' | 'branching' | 'timed' | 'open-world'

export type GameExperienceType = 'puzzle' | 'action' | 'story' | 'creative'

export interface SceneAsset {
  id: string
  type: 'image' | 'sound'
  label: string
  url: string
}

export interface GameScene {
  id: string
  title: string
  narrative: string
  instructions: string
  assets: SceneAsset[]
  pacingHints?: {
    calmMode?: boolean
    fastMode?: boolean
  }
  reinforcement?: string // e.g., token, visual, calming-loop
}

export interface CustomizationBoundaries {
  lockStructure: boolean
  allowThemes: boolean
  allowPacing: boolean
  allowRewards: boolean
  allowAvatars: boolean
  notes?: string
}

export interface GameMoldMeta {
  ageRange: { min: number; max: number }
  difficulty: 'Easy' | 'Medium' | 'Hard'
  learnerProfiles: LearnerProfile[]
  executiveFunctionTargets: string[] // e.g., 'working memory', 'inhibition'
  sensoryPreferences: string[] // e.g., 'low-audio', 'high-contrast'
  skillTargets: string[] // therapist-defined skill tags
}

export interface GameMold {
  id: string
  name: string
  category: string
  structureType: GameStructureType
  experienceType: GameExperienceType
  primaryObjective: string
  rules: string
  scenes: GameScene[]
  customization: CustomizationBoundaries
  meta?: GameMoldMeta
  createdAt: string
  updatedAt: string
  version: number
  personalizationComponent?: string // e.g. 'ExpressionGame', 'MoldPersonalizationWizard'
}


// Expression Game Mold (Personalized, Gemini-powered)
export const EXPRESSION_GAME_MOLD: GameMold = {
  personalizationComponent: 'ExpressionGame',
  id: 'expression_game',
  name: 'Expression Game',
  category: 'Emotions & Social Skills',
  structureType: 'linear',
  experienceType: 'puzzle',
  primaryObjective: 'Practice and identify facial expressions by mimicking and matching emotions.',
  rules: 'The child takes a photo, Gemini generates 4 emotion images (happy, sad, angry, surprised). The child mimics each emotion, detected in real-time using face-api.js. After all, a quiz matches images to emotions.',
  scenes: [
    {
      id: 'capture',
      title: 'Take Your Photo',
      narrative: 'Smile for the camera! We will use your photo to create fun expression challenges.',
      instructions: 'Look at the camera and press the button to take your photo.',
      assets: [],
    },
    {
      id: 'loading',
      title: 'Creating Your Expressions',
      narrative: 'Gemini is generating personalized images for you...',
      instructions: 'Please wait while your game is prepared.',
      assets: [],
    },
    {
      id: 'expression',
      title: 'Mimic the Emotion',
      narrative: 'Try to make the same face as the image shown!',
      instructions: 'Hold the expression until the game detects it.',
      assets: [],
    },
    {
      id: 'quiz',
      title: 'Quiz: Match the Emotion',
      narrative: 'Can you identify the emotions?',
      instructions: 'Connect each image to its correct emotion.',
      assets: [],
    },
    {
      id: 'complete',
      title: 'Congratulations!',
      narrative: 'You completed the Expression Game!',
      instructions: 'Play again or try another game.',
      assets: [],
    }
  ],
  customization: {
    lockStructure: true,
    allowThemes: false,
    allowPacing: false,
    allowRewards: true,
    allowAvatars: false,
    notes: 'Images and flow are personalized using Gemini AI and child webcam input.'
  },
  meta: {
    ageRange: { min: 3, max: 12 },
    difficulty: 'Easy',
    learnerProfiles: ['ASD', 'ADHD', 'HYBRID'],
    executiveFunctionTargets: ['emotion recognition', 'self-awareness'],
    sensoryPreferences: ['low-audio', 'high-contrast'],
    skillTargets: ['facial expression', 'emotion identification', 'social skills']
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1
}

const STORAGE_KEY = 'brainberry_game_molds_v1'

export function loadMolds(): GameMold[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as GameMold[]
  } catch (e) {
    console.warn('Failed to load molds', e)
    return []
  }
}

export function saveMolds(molds: GameMold[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(molds))
  } catch (e) {
    console.warn('Failed to save molds', e)
  }
}

export function upsertMold(mold: GameMold) {
  const molds = loadMolds()
  const idx = molds.findIndex(m => m.id === mold.id)
  if (idx >= 0) molds[idx] = mold
  else molds.push(mold)
  saveMolds(molds)
  return mold
}

export function deleteMold(id: string) {
  const molds = loadMolds().filter(m => m.id !== id)
  saveMolds(molds)
}

export function generateId(prefix: string = 'mold'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
