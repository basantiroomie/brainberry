// Utilities to normalize mold data coming from API/DB (snake_case)
// into the UI-facing shape (camelCase) that the studio components expect.
// Adds: runtime schema validation (zod) and deterministic IDs.

import { z } from 'zod'

/**
 * Small, fast, deterministic hash (FNV-1a 32-bit) encoded base36 for compact IDs.
 */
function stableHash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(36)
}

function coerceString(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v)
}
function coerceBoolean(v: unknown, fallback = false): boolean {
  return v == null ? fallback : Boolean(v)
}
function coerceNumber(v: unknown, fallback = 0): number {
  if (v == null) return fallback
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const parsed = Number(v)
    return isNaN(parsed) ? v as any : parsed // Let Zod catch non-numbers
  }
  return v as any // Let Zod catch invalid types
}
function coerceArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

// Zod schemas for runtime validation
const AssetSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  url: z.string(),
  description: z.string(),
})

const SceneSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string(),
  instructions: z.string(),
  assets: z.array(AssetSchema),
  pacingHints: z.record(z.any()).default({}),
  reinforcement: z.string(),
})

const CustomizationSchema = z.object({
  lockStructure: z.boolean(),
  allowThemes: z.boolean(),
  allowPacing: z.boolean(),
  allowRewards: z.boolean(),
  allowAvatars: z.boolean(),
  notes: z.string(),
})

const MetaSchema = z.object({
  ageRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  difficulty: z.string(),
  learnerProfiles: z.array(z.any()),
  executiveFunctionTargets: z.array(z.any()),
  sensoryPreferences: z.array(z.any()),
  skillTargets: z.array(z.any()),
})

const MoldSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  category: z.string(),
  structureType: z.string(),
  experienceType: z.string(),
  primaryObjective: z.string(),
  rules: z.string(),
  scenes: z.array(SceneSchema),
  customization: CustomizationSchema,
  meta: MetaSchema,
  version: z.number(),
})

export type Asset = z.infer<typeof AssetSchema>
export type Scene = z.infer<typeof SceneSchema>
export type Customization = z.infer<typeof CustomizationSchema>
export type Meta = z.infer<typeof MetaSchema>
export type Mold = z.infer<typeof MoldSchema>

// Legacy type for backward compatibility
type AnyObj = Record<string, any>

/**
 * Generate deterministic scene ID based on stable fields
 */
function sceneIdFor(moldKey: string, index: number, scene: Record<string, unknown>): string {
  const explicit = scene.id
  if (typeof explicit === 'string' && explicit.trim()) return explicit
  
  const title = coerceString(scene.title)
  const narrative = coerceString(scene.narrative)
  return `scene_${stableHash(`${moldKey}|${index}|${title}|${narrative}`)}`
}

/**
 * Generate deterministic asset ID based on stable fields
 */
function assetIdFor(moldKey: string, sceneIdx: number, assetIdx: number, asset: Record<string, unknown>): string {
  const explicit = asset.id
  if (typeof explicit === 'string' && explicit.trim()) return explicit
  
  const type = coerceString(asset.type, 'image')
  const label = coerceString(asset.label)
  const url = coerceString(asset.url)
  return `asset_${stableHash(`${moldKey}|${sceneIdx}|${assetIdx}|${type}|${label}|${url}`)}`
}

/**
 * Normalize a single mold from mixed API shapes (snake_case or camelCase) into our UI shape,
 * validate it at runtime (Zod), and return a strongly-typed Mold.
 * Throws ZodError on validation failure.
 */
export function normalizeMoldFromApi(dbMold: AnyObj): Mold {
  if (!dbMold || typeof dbMold !== 'object') {
    throw new Error('normalizeMoldFromApi: expected object')
  }
  
  const src = dbMold as Record<string, unknown>

  // Extract rules string from multiple possible shapes
  const rules = (() => {
    const r = src.rules
    if (!r) return ''
    if (typeof r === 'string') return r
    if (typeof r === 'object' && r !== null && 'description' in r) {
      const d = (r as Record<string, unknown>).description
      return typeof d === 'string' ? d : ''
    }
    return ''
  })()

  const moldId = typeof src.id === 'string' ? src.id : null
  const moldKey = moldId || coerceString(src.name) || 'mold'

  const metaSrc = (src.metadata as Record<string, unknown>) ?? (src.meta as Record<string, unknown>) ?? {}

  const meta: Meta = {
    ageRange: {
      min: coerceNumber(src.age_min ?? (metaSrc as any)?.ageRange?.min, 5),
      max: coerceNumber(src.age_max ?? (metaSrc as any)?.ageRange?.max, 12),
    },
    difficulty: coerceString((metaSrc as any)?.difficulty, 'Medium'),
    learnerProfiles: coerceArray((metaSrc as any)?.learnerProfiles),
    executiveFunctionTargets: coerceArray((metaSrc as any)?.executiveFunctionTargets),
    sensoryPreferences: coerceArray((metaSrc as any)?.sensoryPreferences),
    skillTargets: coerceArray((metaSrc as any)?.skillTargets),
  }

  // Process scenes with deterministic IDs
  const scenesInput = coerceArray<Record<string, unknown>>(src.scenes)
  const scenes = scenesInput.map((s, idx) => {
    // Handle null/invalid scene objects
    const sceneObj = s && typeof s === 'object' ? s : {}
    const cfg = (sceneObj as any)?.config as Record<string, unknown> | undefined

    // Derive normalized scene fields from multiple possible shapes
    const title = coerceString((sceneObj as any)?.title ?? (sceneObj as any)?.name)
    const narrative = coerceString((sceneObj as any)?.narrative ?? (sceneObj as any)?.description ?? cfg?.narrative)
    const instructions = coerceString((sceneObj as any)?.instructions ?? cfg?.instructions)
    const pacingHints = (sceneObj as any)?.pacing_hints ?? (sceneObj as any)?.pacingHints ?? cfg?.pacing_hints ?? {}
    const reinforcement = coerceString((sceneObj as any)?.reinforcement ?? cfg?.reinforcement)

    const assetsInput = coerceArray<Record<string, unknown>>((sceneObj as any)?.assets)
    const assets: Asset[] = assetsInput.map((a, aIdx) => {
      // Handle null/invalid asset objects  
      const assetObj = a && typeof a === 'object' ? a : {}
      const meta = (assetObj as any)?.metadata as Record<string, unknown> | undefined

      const type = coerceString((assetObj as any)?.type ?? (assetObj as any)?.asset_type, 'image')
      const label = coerceString((assetObj as any)?.label ?? (assetObj as any)?.name)
      const url = coerceString((assetObj as any)?.url)
      const description = coerceString((assetObj as any)?.description ?? meta?.description)

      return {
        id: assetIdFor(moldKey, idx, aIdx, { type, label, url }),
        type,
        label,
        url,
        description,
      }
    })

    return {
      id: sceneIdFor(moldKey, idx, { title, narrative }),
      title,
      narrative,
      instructions,
      assets,
      pacingHints: pacingHints as Record<string, unknown>,
      reinforcement,
    }
  })

  const customization: Customization = {
    lockStructure: coerceBoolean(src.lock_structure ?? (src.customization as any)?.lockStructure, false),
    allowThemes: coerceBoolean(src.allow_themes ?? (src.customization as any)?.allowThemes, true),
    allowPacing: coerceBoolean(src.allow_pacing ?? (src.customization as any)?.allowPacing, true),
    allowRewards: coerceBoolean(src.allow_rewards ?? (src.customization as any)?.allowRewards, true),
    allowAvatars: coerceBoolean(src.allow_avatars ?? (src.customization as any)?.allowAvatars, true),
    notes: coerceString(src.customization_notes ?? (src.customization as any)?.notes, ''),
  }

  const normalized = {
    id: moldId,
    name: coerceString(src.name),
    category: coerceString(src.category, 'attention'),
    structureType: coerceString(src.structure_type ?? src.structureType, 'linear'),
    experienceType: coerceString(src.experience_type ?? src.experienceType, 'puzzle'),
    primaryObjective: coerceString(src.primary_objective ?? src.primaryObjective),
    rules,
    scenes,
    customization,
    meta,
    version: coerceNumber(src.version, 1),
  }

  // Runtime validation - throws ZodError if invalid
  return MoldSchema.parse(normalized)
}

/**
 * Safe variant: returns { success, data|error } instead of throwing.
 */
export function tryNormalizeMoldFromApi(dbMold: unknown) {
  try {
    const data = normalizeMoldFromApi(dbMold as AnyObj)
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, error }
  }
}

export function normalizeMoldArrayFromApi(arr: AnyObj[]): Mold[] {
  if (!Array.isArray(arr)) return []
  return arr.map(normalizeMoldFromApi)
}
