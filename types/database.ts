// Database types that match your Supabase schema
// Run `pnpm supabase:types` to auto-generate from your actual Supabase instance

export interface EducatorAccount {
  id: string
  created_at: string
  updated_at: string
}

export interface ChildProfile {
  id: string
  name: string
  age?: number
  diagnosis?: string
  notes?: string
  accessCode: string
  educatorId: string
  avatar_url?: string
  avatar_headshot_url?: string
  avatar_permissions?: {
    can_customize: boolean
    can_chat: boolean
    chat_time_limit_minutes: number
  }
  created_at: string
  updated_at: string
}

export interface GameMold {
  id: string
  name: string
  category?: string
  structureType?: string
  experienceType?: string
  primaryObjective?: string
  rules?: any
  lockStructure: boolean
  allowThemes: boolean
  allowPacing: boolean
  allowRewards: boolean
  allowAvatars: boolean
  customizationNotes?: string
  ageMin?: number
  ageMax?: number
  version: number
  created_at: string
  updated_at: string
  scenes?: Scene[]
}

export interface Scene {
  id: string
  moldId: string
  index: number
  title?: string
  description?: string
  backgroundMusic?: string
  voiceNarration?: string
  pacingNormal: boolean
  pacingFast: boolean
  reinforcement?: string
  created_at: string
  updated_at: string
  assets?: Asset[]
}

export interface Asset {
  id: string
  sceneId: string
  type: string
  label?: string
  url: string
  created_at: string
  updated_at: string
}

export interface MoldAssignment {
  id: string
  moldId: string
  childId: string
  status: string
  progress: number
  lastInteraction?: string
  created_at: string
  updated_at: string
  mold?: GameMold
  child?: ChildProfile
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
  mode?: string
  notes?: string
  skillMetrics?: any
  engagementLevel: number
  created_at: string
  updated_at: string
}

// New: Personalized immutable molds
export interface PersonalizedMold {
  id: string
  child_id: string
  mold_id: string
  title?: string
  config: any
  created_at: string
  updated_at: string
}

export interface MoldCustomizationRequest {
  id: string
  child_id: string
  mold_id: string
  personalization_id: string
  prompt: string
  target: any
  status: string
  result?: any
  error?: string
  created_at: string
  updated_at: string
}
