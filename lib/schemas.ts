import { z } from 'zod'

export const assetSchema = z.object({
  type: z.enum(['image','sound']),
  label: z.string().min(1),
  url: z.string().url()
})

export const sceneSchemaServer = z.object({
  title: z.string().min(1),
  narrative: z.string().optional(),
  instructions: z.string().min(1),
  pacingHints: z.object({ calmMode: z.boolean().optional(), fastMode: z.boolean().optional() }).optional(),
  reinforcement: z.string().optional(),
  assets: z.array(assetSchema).default([])
})

export const gameMoldBaseSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  structureType: z.enum(['linear','branching','timed','open-world']),
  experienceType: z.enum(['puzzle','action','story','creative']),
  primaryObjective: z.string().min(5),
  rules: z.string().min(5),
  lockStructure: z.boolean().default(false),
  allowThemes: z.boolean().default(true),
  allowPacing: z.boolean().default(true),
  allowRewards: z.boolean().default(true),
  allowAvatars: z.boolean().default(true),
  customizationNotes: z.string().optional(),
  ageMin: z.number().int().min(1).max(25),
  ageMax: z.number().int().min(1).max(25),
  difficulty: z.enum(['Easy','Medium','Hard']),
  learnerProfiles: z.array(z.enum(['ASD','ADHD','HYBRID'])).min(1),
  executiveFunctionTargets: z.array(z.string()).optional().default([]),
  sensoryPreferences: z.array(z.string()).optional().default([]),
  skillTargets: z.array(z.string()).optional().default([]),
  scenes: z.array(sceneSchemaServer).min(1)
}).refine(d => d.ageMin <= d.ageMax, { message: 'ageMin must be <= ageMax', path: ['ageMin'] })

export const childCreateSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(1).max(25),
  diagnosis: z.string().min(2),
  notes: z.string().optional()
})

export const assignmentCreateSchema = z.object({
  childId: z.string().min(1),
  moldId: z.string().min(1)
})

export const assignmentUpdateSchema = z.object({
  status: z.enum(['assigned','in-progress','completed']).optional(),
  progress: z.number().min(0).max(100).optional()
})

export const sessionCreateSchema = z.object({
  childId: z.string().min(1),
  moldId: z.string().min(1),
  assignmentId: z.string().optional(),
  durationSec: z.number().int().min(0).default(0),
  completionPercent: z.number().int().min(0).max(100).default(0),
  mode: z.string().optional(),
  notes: z.string().optional(),
  skillMetrics: z.record(z.number()).optional()
})

export type GameMoldInput = z.infer<typeof gameMoldBaseSchema>
