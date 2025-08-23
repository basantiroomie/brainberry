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
