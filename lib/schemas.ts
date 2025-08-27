import { z } from 'zod'

// Avatar System Schemas (defined early as they're referenced by other schemas)
export const avatarPermissionsSchema = z.object({
  can_customize: z.boolean().default(true),
  can_chat: z.boolean().default(true),
  chat_time_limit_minutes: z.number().int().positive().default(30)
})

export const readyPlayerMeConfigSchema = z.object({
  id: z.string(),
  assets: z.record(z.string()), // category -> asset_id mapping
  morphTargets: z.record(z.number()).optional(),
  metadata: z.object({
    created_from_photo: z.boolean(),
    last_customized: z.string(),
    customization_count: z.number().int().min(0)
  })
})

// Educator Account Schema
export const educatorAccountSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  institution: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const educatorAccountCreateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1, 'Name is required'),
  institution: z.string().optional()
})

export const educatorAccountUpdateSchema = educatorAccountCreateSchema.partial()

// Child Profile Schema
export const childProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  age: z.number().int().positive().max(17),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  access_code: z.string().max(6),
  educator_id: z.string().uuid(),
  avatar_url: z.string().url().optional(),
  avatar_headshot_url: z.string().url().optional(),
  avatar_permissions: avatarPermissionsSchema.optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const childCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive().max(17),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  access_code: z.string().min(3).max(6, 'Access code must be 6 characters or less')
})

export const childUpdateSchema = childCreateSchema.partial()

// Game Mold Schema
export const gameMoldSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string().optional(),
  structure_type: z.string().optional(),
  experience_type: z.string().optional(),
  primary_objective: z.string().optional(),
  rules: z.record(z.any()).default({}),
  lock_structure: z.boolean().default(false),
  allow_themes: z.boolean().default(true),
  allow_pacing: z.boolean().default(true),
  allow_rewards: z.boolean().default(true),
  allow_avatars: z.boolean().default(true),
  customization_notes: z.string().optional(),
  age_min: z.number().int().optional(),
  age_max: z.number().int().optional(),
  version: z.number().int().default(1),
  created_at: z.string(),
  updated_at: z.string()
})

export const gameMoldCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  structure_type: z.string().optional(),
  experience_type: z.string().optional(),
  primary_objective: z.string().optional(),
  rules: z.record(z.any()).default({}),
  lock_structure: z.boolean().default(false),
  allow_themes: z.boolean().default(true),
  allow_pacing: z.boolean().default(true),
  allow_rewards: z.boolean().default(true),
  allow_avatars: z.boolean().default(true),
  customization_notes: z.string().optional(),
  age_min: z.number().int().optional(),
  age_max: z.number().int().optional()
})

// Scene Schema
export const sceneSchema = z.object({
  id: z.string().uuid(),
  mold_id: z.string().uuid(),
  scene_index: z.number().int(),
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string()
})

// Mold Assignment Schema
export const moldAssignmentSchema = z.object({
  id: z.string().uuid(),
  mold_id: z.string().uuid(),
  child_id: z.string().uuid(),
  educator_id: z.string().uuid(),
  assigned_at: z.string(),
  due_date: z.string().optional(),
  status: z.enum(['assigned', 'in_progress', 'completed', 'skipped']).default('assigned'),
  notes: z.string().optional()
})

export const moldAssignmentCreateSchema = z.object({
  mold_id: z.string().uuid(),
  child_id: z.string().uuid(),
  due_date: z.string().optional(),
  notes: z.string().optional()
})

export const assignmentUpdateSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed', 'skipped']).optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
})

// Game Session Schema
export const gameSessionSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  mold_id: z.string().uuid(),
  assignment_id: z.string().uuid().optional(),
  started_at: z.string(),
  ended_at: z.string().optional(),
  duration_seconds: z.number().int().optional(),
  progress_data: z.record(z.any()).default({}),
  completion_status: z.enum(['in_progress', 'completed', 'abandoned']).default('in_progress'),
  score: z.number().int().optional(),
  achievements: z.array(z.any()).default([])
})

export const gameSessionCreateSchema = z.object({
  child_id: z.string().uuid(),
  mold_id: z.string().uuid(),
  assignment_id: z.string().uuid().optional()
})

export const sessionCreateSchema = z.object({
  childId: z.string().uuid(),
  moldId: z.string().uuid(),
  assignmentId: z.string().uuid().optional(),
  durationSec: z.number().int().min(0).optional(),
  completionPercent: z.number().min(0).max(100),
  mode: z.string().optional(),
  notes: z.string().optional(),
  skillMetrics: z.record(z.number()).optional()
})

// Type exports
export type EducatorAccount = z.infer<typeof educatorAccountSchema>
export type EducatorAccountCreate = z.infer<typeof educatorAccountCreateSchema>
export type EducatorAccountUpdate = z.infer<typeof educatorAccountUpdateSchema>

export type ChildProfile = z.infer<typeof childProfileSchema>
export type ChildCreate = z.infer<typeof childCreateSchema>
export type ChildUpdate = z.infer<typeof childUpdateSchema>

export type GameMold = z.infer<typeof gameMoldSchema>
export type GameMoldCreate = z.infer<typeof gameMoldCreateSchema>

export type Scene = z.infer<typeof sceneSchema>
export type MoldAssignment = z.infer<typeof moldAssignmentSchema>
export type MoldAssignmentCreate = z.infer<typeof moldAssignmentCreateSchema>

export type GameSession = z.infer<typeof gameSessionSchema>
export type GameSessionCreate = z.infer<typeof gameSessionCreateSchema>


export const createAvatarRequestSchema = z.object({
  childId: z.string().uuid(),
  photo: z.instanceof(File)
})

export const updateAvatarRequestSchema = z.object({
  childId: z.string().uuid(),
  avatarConfig: readyPlayerMeConfigSchema
})

export const avatarResponseSchema = z.object({
  success: z.boolean(),
  avatarUrl: z.string().url().optional(),
  headshotUrl: z.string().url().optional(),
  error: z.string().optional()
})

export const ttsConfigSchema = z.object({
  engine: z.enum(['speechSynthesis', 'elevenlabs']),
  preferredVoices: z.array(z.string()),
  fallbackVoice: z.string(),
  rate: z.number().min(0.1).max(2.0).default(0.9),
  pitch: z.number().min(0.1).max(2.0).default(1.1),
  volume: z.number().min(0).max(1).default(0.8),
  voiceFilters: z.object({
    excludeRobotic: z.boolean().default(true),
    preferNeural: z.boolean().default(true),
    preferLocal: z.boolean().default(true)
  }).optional()
})

export const elevenLabsConfigSchema = z.object({
  apiKey: z.string(),
  voiceId: z.string(),
  model: z.string().default('eleven_monolingual_v1'),
  stability: z.number().min(0).max(1).default(0.5),
  similarity_boost: z.number().min(0).max(1).default(0.5)
})

// File upload validation for avatar photos
export const avatarPhotoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'File must be a JPEG or PNG image'
    )
})

// Avatar Code Validation Schema
export const avatarCodeSchema = z.object({
  code: z.string()
    .regex(/^[A-Z0-9]{6}$/, "Avatar code must be 6 uppercase alphanumeric characters")
    .length(6, "Avatar code must be exactly 6 characters")
})

export const avatarCodeToUrlsSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6}$/, "Avatar code must be 6 uppercase alphanumeric characters"),
  glbUrl: z.string().url().optional(),
  pngUrl: z.string().url().optional()
})

// Avatar Update with Code Schema
export const updateChildAvatarSchema = z.object({
  avatar_code: avatarCodeSchema.shape.code.optional(),
  avatar_url: z.string().url().optional(),
  avatar_headshot_url: z.string().url().optional()
}).refine(
  (data) => data.avatar_code || (data.avatar_url && data.avatar_headshot_url),
  "Either avatar_code or both avatar_url and avatar_headshot_url must be provided"
)

// Avatar type exports
export type AvatarPermissions = z.infer<typeof avatarPermissionsSchema>
export type ReadyPlayerMeConfig = z.infer<typeof readyPlayerMeConfigSchema>
export type CreateAvatarRequest = z.infer<typeof createAvatarRequestSchema>
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>
export type AvatarResponse = z.infer<typeof avatarResponseSchema>
export type TTSConfig = z.infer<typeof ttsConfigSchema>
export type ElevenLabsConfig = z.infer<typeof elevenLabsConfigSchema>
export type AvatarCode = z.infer<typeof avatarCodeSchema>
export type AvatarCodeToUrls = z.infer<typeof avatarCodeToUrlsSchema>
export type UpdateChildAvatar = z.infer<typeof updateChildAvatarSchema>