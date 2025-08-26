// Centralized game type definitions for type safety and consistency

export interface GameConfig {
  id?: string
  game_type: 'matching_cards' | 'sorting' | 'puzzle' | 'drawing' | 'storytelling'
  title?: string
  theme: string
  difficulty: 'easy' | 'medium' | 'hard'
  cards?: Card[]
  categories?: Category[]
  ui_customization?: UICustomization
  rules?: GameRules
  main_image?: {
    pieces?: number
    url?: string
  }
}

export interface Card {
  id: number
  pair_id: number
  image_url: string
  label: string
  isFlipped: boolean
  isMatched: boolean
  ai_generation?: AIGeneration
}

export interface Category {
  id: number
  name: string
  color: string
  description?: string
  items: Item[]
}

export interface Item {
  id: string
  name?: string
  label?: string
  image_url: string
  category_id: number
  description?: string
  placed: boolean
  ai_generation?: AIGeneration
}

export interface AIGeneration {
  image_prompt: string
  style_prompt: string
  verification_prompt: string
  fallback_emoji: string
  gemini_generated?: boolean
}

export interface UICustomization {
  success_message?: string
  primary_color?: string
  secondary_color?: string
  background_color?: string
  font_family?: string
  encouragement_messages?: string[]
}

export interface GameRules {
  time_limit?: number
  max_attempts?: number
  scoring_system?: 'points' | 'time' | 'accuracy'
  hints_enabled?: boolean
  sound_enabled?: boolean
}

export interface GameSession {
  id: string
  childId: string
  moldId: string
  assignmentId?: string
  startedAt: string
  endedAt?: string
  durationSec: number
  completionPercent: number
  score?: number
  moves?: number
  mode?: string
  notes?: string
  skillMetrics?: Record<string, number>
  engagementLevel?: number
}

export interface GameMetrics {
  totalTime?: number
  accuracy?: number
  attempts?: number
  hintsUsed?: number
  completionRate?: number
  skillProgression?: Record<string, number>
}

export interface PersonalizedMold {
  id: string
  child_id: string
  mold_id: string
  title?: string
  game_data: GameConfig
  created_at: string
  updated_at: string
}

// Common component props interfaces
export interface GamePlayerProps {
  gameConfig: GameConfig
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

export interface GameLoadingProps {
  progress: number
  total: number
  gameTitle?: string
  theme?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error?: string
  status: 'success' | 'error'
  message?: string
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: Record<string, any>
}

// Utility types for game states
export type GameState = 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error'
export type SoundType = 'match' | 'victory' | 'flip' | 'correct' | 'wrong' | 'complete'
export type ThemeType = 'animals' | 'family' | 'toys' | 'food' | 'characters' | 'default'

// Type guards for runtime type checking
export function isGameConfig(obj: any): obj is GameConfig {
  return obj && typeof obj === 'object' && 
         typeof obj.game_type === 'string' &&
         typeof obj.theme === 'string'
}

export function isCard(obj: any): obj is Card {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'number' &&
         typeof obj.image_url === 'string' &&
         typeof obj.label === 'string'
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj === 'object' &&
         ('data' in obj || 'error' in obj) &&
         typeof obj.status === 'string'
}
