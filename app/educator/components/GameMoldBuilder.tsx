"use client"

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { generateId, GameMold } from '@/lib/molds'
import { toast } from 'sonner'
import { X, Plus, Save, Info } from 'lucide-react'

const assetSchema = z.object({
  id: z.string(),
  type: z.enum(['image','sound']),
  label: z.string().min(1,'Label required'),
  url: z.string().url('Valid URL required')
})

const sceneSchema = z.object({
  id: z.string(),
  title: z.string().min(1,'Title required'),
  narrative: z.string().optional().default(''),
  instructions: z.string().min(1,'Instructions required'),
  pacingHints: z.object({ calmMode: z.boolean().optional(), fastMode: z.boolean().optional() }).optional(),
  reinforcement: z.string().optional(),
  assets: z.array(assetSchema)
})

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2,'Name too short'),
  category: z.string().min(1,'Category required'),
  structureType: z.enum(['linear','branching','timed','open-world']),
  experienceType: z.enum(['puzzle','action','story','creative']),
  primaryObjective: z.string().min(5,'Objective required'),
  rules: z.string().min(5,'Rules required'),
  ageMin: z.coerce.number().int().min(1).max(25),
  ageMax: z.coerce.number().int().min(1).max(25),
  difficulty: z.enum(['Easy','Medium','Hard']),
  learnerProfiles: z.array(z.enum(['ASD','ADHD','HYBRID'])).min(1,'Select at least one profile'),
  executiveFunctionTargets: z.string().optional(), // comma separated
  sensoryPreferences: z.string().optional(),
  skillTargets: z.string().optional(),
  lockStructure: z.boolean().default(false),
  allowThemes: z.boolean().default(true),
  allowPacing: z.boolean().default(true),
  allowRewards: z.boolean().default(true),
  allowAvatars: z.boolean().default(true),
  customizationNotes: z.string().optional(),
  scenes: z.array(sceneSchema).min(1,'At least one scene required')
}).refine(d => d.ageMin <= d.ageMax,{ message: 'Min age must be <= Max age', path: ['ageMin'] })

export type GameMoldFormValues = z.infer<typeof formSchema>

interface Props {
  onCancel: () => void
  initialData?: GameMold | null
  onSaved?: (mold: GameMold) => void
}

export default function GameMoldBuilder({ onCancel, initialData, onSaved }: Props) {
  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<GameMoldFormValues>({
    resolver: zodResolver(formSchema) as any, // cast to relax version mismatch typing
    defaultValues: (initialData ? mapMoldToForm(initialData) : defaultInitialValues()) as any
  })

  useEffect(() => {
    if (initialData) {
      reset(mapMoldToForm(initialData))
    }
  }, [initialData, reset])

  const scenesArray = useFieldArray({ control, name: 'scenes' })
  const watchScenes = watch('scenes')

  function defaultInitialValues(): GameMoldFormValues {
    return {
      name: '',
      category: 'attention',
      structureType: 'linear',
      experienceType: 'puzzle',
      primaryObjective: '',
      rules: '',
      ageMin: 5,
      ageMax: 12,
      difficulty: 'Easy',
      learnerProfiles: ['ASD'],
      executiveFunctionTargets: '',
      sensoryPreferences: '',
      skillTargets: '',
      lockStructure: false,
      allowThemes: true,
      allowPacing: true,
      allowRewards: true,
      allowAvatars: true,
      customizationNotes: '',
      scenes: [
        { id: generateId('scene'), title: 'Intro', narrative: '', instructions: '', assets: [], pacingHints: {}, reinforcement: '' }
      ]
    }
  }

  function mapMoldToForm(m: GameMold): GameMoldFormValues {
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      structureType: m.structureType,
      experienceType: m.experienceType,
      primaryObjective: m.primaryObjective,
      rules: m.rules,
      ageMin: m.meta?.ageRange?.min || 3,
      ageMax: m.meta?.ageRange?.max || 12,
      difficulty: m.meta?.difficulty || 'Medium',
      learnerProfiles: m.meta?.learnerProfiles || [],
      executiveFunctionTargets: m.meta?.executiveFunctionTargets?.join(', ') || '',
      sensoryPreferences: m.meta?.sensoryPreferences?.join(', ') || '',
      skillTargets: m.meta?.skillTargets?.join(', ') || '',
      lockStructure: m.customization.lockStructure,
      allowThemes: m.customization.allowThemes,
      allowPacing: m.customization.allowPacing,
      allowRewards: m.customization.allowRewards,
      allowAvatars: m.customization.allowAvatars,
      customizationNotes: m.customization.notes || '',
      scenes: m.scenes.map(s => ({
        id: s.id,
        title: s.title,
        narrative: s.narrative,
        instructions: s.instructions,
        assets: s.assets,
        pacingHints: s.pacingHints,
        reinforcement: s.reinforcement
      }))
    }
  }

  async function onSubmit(values: GameMoldFormValues) {
    const payload = {
      name: values.name,
      category: values.category,
      structureType: values.structureType,
      experienceType: values.experienceType,
      primaryObjective: values.primaryObjective,
      rules: values.rules,
      scenes: values.scenes.map(s => ({
        title: s.title,
        narrative: s.narrative,
        instructions: s.instructions,
        assets: s.assets,
        pacingHints: s.pacingHints,
        reinforcement: s.reinforcement
      })),
      lockStructure: values.lockStructure,
      allowThemes: values.allowThemes,
      allowPacing: values.allowPacing,
      allowRewards: values.allowRewards,
      allowAvatars: values.allowAvatars,
      customizationNotes: values.customizationNotes,
      ageMin: values.ageMin,
      ageMax: values.ageMax,
      difficulty: values.difficulty,
      learnerProfiles: values.learnerProfiles,
      executiveFunctionTargets: splitValues(values.executiveFunctionTargets),
      sensoryPreferences: splitValues(values.sensoryPreferences),
      skillTargets: splitValues(values.skillTargets)
    }

    const method = values.id ? 'PUT' : 'POST'
    const url = values.id ? `/api/molds/${values.id}` : '/api/molds'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      toast.error('Failed to save mold')
      return
    }
    const mold = await res.json()
    toast.success(values.id ? 'Mold updated' : 'Mold created')
    onSaved?.(mold)
  }

  function splitValues(v?: string) { return v ? v.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [] }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{watch('id') ? 'EDIT GAME MOLD' : 'CREATE GAME MOLD'}</h1>
          <div className="space-x-2">
            <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal font-bold">CANCEL</button>
            <button type="submit" className="bg-chart-1 text-white px-6 py-2 border-2 border-black shadow-brutal font-bold inline-flex items-center space-x-2">
              <Save className="h-4 w-4"/><span>SAVE MOLD</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 flex items-start"><Info className="h-4 w-4 mr-2 mt-0.5"/>This builder captures therapeutic structure that downstream AI personalization must respect (locked structure, pacing, rewards).</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Core Details */}
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Core Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-sm">Name</label>
                <input {...register('name')} className="w-full border-2 border-black p-2" placeholder="Focus Quest" />
                {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
              </div>
              <div>
                <label className="font-bold text-sm">Category</label>
                <select {...register('category')} className="w-full border-2 border-black p-2">
                  <option value="memory">Memory</option>
                  <option value="attention">Attention</option>
                  <option value="emotional">Emotional</option>
                  <option value="social">Social</option>
                  <option value="motor">Motor</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-sm">Structure Type</label>
                <select {...register('structureType')} className="w-full border-2 border-black p-2">
                  <option value="linear">Linear</option>
                  <option value="branching">Branching</option>
                  <option value="timed">Timed</option>
                  <option value="open-world">Open World</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-sm">Experience Type</label>
                <select {...register('experienceType')} className="w-full border-2 border-black p-2">
                  <option value="puzzle">Puzzle</option>
                  <option value="action">Action/Reaction</option>
                  <option value="story">Story/Adventure</option>
                  <option value="creative">Creative/Building</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-sm">Difficulty</label>
                <select {...register('difficulty')} className="w-full border-2 border-black p-2">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="font-bold text-sm">Age Min</label>
                  <input type="number" {...register('ageMin')} className="w-full border-2 border-black p-2" />
                </div>
                <div className="flex-1">
                  <label className="font-bold text-sm">Age Max</label>
                  <input type="number" {...register('ageMax')} className="w-full border-2 border-black p-2" />
                </div>
              </div>
            </div>
            <div>
              <label className="font-bold text-sm">Primary Objective</label>
              <textarea {...register('primaryObjective')} className="w-full border-2 border-black p-2 h-20" placeholder="Maintain attention on multi-step task" />
              {errors.primaryObjective && <p className="text-red-600 text-xs">{errors.primaryObjective.message}</p>}
            </div>
            <div>
              <label className="font-bold text-sm">Rules / Instructions</label>
              <textarea {...register('rules')} className="w-full border-2 border-black p-2 h-28" placeholder="Complete each micro-task before the timer token depletes..." />
              {errors.rules && <p className="text-red-600 text-xs">{errors.rules.message}</p>}
            </div>
          </div>

          {/* Scenes */}
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Scenes & Flow</h2>
              <button type="button" onClick={() => scenesArray.append({ id: generateId('scene'), title: 'New Scene', narrative: '', instructions: '', assets: [], pacingHints: {}, reinforcement: '' })} className="bg-chart-2 text-white px-3 py-2 border-2 border-black shadow-brutal text-sm font-bold inline-flex items-center space-x-1"><Plus className="h-4 w-4"/><span>ADD SCENE</span></button>
            </div>
            {watchScenes.map((scene, idx) => (
              <div key={scene.id} className="border-2 border-black p-4 relative bg-secondary">
                <div className="absolute -top-3 -left-3 bg-chart-3 text-white text-xs font-bold px-2 py-1 border-2 border-black shadow-brutal">{idx+1}</div>
                <button type="button" onClick={() => scenesArray.remove(idx)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center border-2 border-black shadow-brutal" aria-label="Remove Scene"><X className="h-4 w-4"/></button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-xs">Title</label>
                    <input {...register(`scenes.${idx}.title` as const)} className="w-full border-2 border-black p-2 text-sm" />
                  </div>
                  <div>
                    <label className="font-bold text-xs">Reinforcement</label>
                    <input {...register(`scenes.${idx}.reinforcement` as const)} className="w-full border-2 border-black p-2 text-sm" placeholder="token, visual, calming-loop" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="font-bold text-xs">Narrative (optional)</label>
                  <textarea {...register(`scenes.${idx}.narrative` as const)} className="w-full border-2 border-black p-2 text-sm h-16" />
                </div>
                <div className="mt-2">
                  <label className="font-bold text-xs">Instructions</label>
                  <textarea {...register(`scenes.${idx}.instructions` as const)} className="w-full border-2 border-black p-2 text-sm h-20" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 text-xs font-bold"><input type="checkbox" {...register(`scenes.${idx}.pacingHints.calmMode` as const)} /> <span>Calm Mode Optimized</span></label>
                  <label className="flex items-center space-x-2 text-xs font-bold"><input type="checkbox" {...register(`scenes.${idx}.pacingHints.fastMode` as const)} /> <span>Fast Mode Optimized</span></label>
                </div>
                {/* Assets */}
                <div className="mt-4 border-t border-black pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm">Assets</h3>
                    <button type="button" onClick={() => {
                      const current = watch('scenes')
                      current[idx].assets.push({ id: generateId('asset'), type: 'image', label: 'New Asset', url: 'https://example.com/asset.png' })
                      reset({ ...watch(), scenes: [...current] })
                    }} className="bg-chart-3 text-white px-2 py-1 border-2 border-black shadow-brutal text-xs font-bold flex items-center space-x-1"><Plus className="h-3 w-3"/><span>ADD ASSET</span></button>
                  </div>
                  <div className="space-y-2">
                    {scene.assets.map((asset, aIdx) => (
                      <div key={asset.id} className="bg-white border-2 border-black p-2 relative">
                        <button type="button" onClick={() => {
                          const current = watch('scenes')
                          current[idx].assets.splice(aIdx,1)
                          reset({ ...watch(), scenes: [...current] })
                        }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center border-2 border-black" aria-label="Remove Asset"><X className="h-3 w-3"/></button>
                        <div className="grid grid-cols-5 gap-2 items-center">
                          <select {...register(`scenes.${idx}.assets.${aIdx}.type` as const)} className="border-2 border-black p-1 text-xs col-span-1">
                            <option value="image">IMG</option>
                            <option value="sound">SND</option>
                          </select>
                          <input {...register(`scenes.${idx}.assets.${aIdx}.label` as const)} className="border-2 border-black p-1 text-xs col-span-2" placeholder="Label" />
                          <input {...register(`scenes.${idx}.assets.${aIdx}.url` as const)} className="border-2 border-black p-1 text-xs col-span-2" placeholder="https://..." />
                        </div>
                      </div>
                    ))}
                    {scene.assets.length === 0 && <p className="text-xs text-gray-500 italic">No assets yet.</p>}
                  </div>
                </div>
              </div>
            ))}
            {errors.scenes && <p className="text-red-600 text-xs">{errors.scenes.message as string}</p>}
          </div>
        </div>

        {/* Meta & Customization */}
        <div className="space-y-6">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Learner Targeting</h2>
            <div>
              <label className="font-bold text-xs mb-1 block">Learner Profiles</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {['ASD','ADHD','HYBRID'].map(p => (
                  <label key={p} className="flex items-center space-x-1 border-2 border-black p-2 bg-secondary">
                    <input type="checkbox" value={p} {...register('learnerProfiles')} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
              {errors.learnerProfiles && <p className="text-red-600 text-xs">{errors.learnerProfiles.message}</p>}
            </div>
            <div>
              <label className="font-bold text-xs">Executive Function Targets (comma separated)</label>
              <textarea {...register('executiveFunctionTargets')} className="w-full border-2 border-black p-2 text-sm h-16" placeholder="working memory, inhibition" />
            </div>
            <div>
              <label className="font-bold text-xs">Skill Targets (comma separated)</label>
              <textarea {...register('skillTargets')} className="w-full border-2 border-black p-2 text-sm h-16" placeholder="attention shifting, sequencing" />
            </div>
            <div>
              <label className="font-bold text-xs">Sensory Preferences (comma separated)</label>
              <textarea {...register('sensoryPreferences')} className="w-full border-2 border-black p-2 text-sm h-16" placeholder="low-audio, minimal flicker" />
            </div>
          </div>
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Customization Boundaries</h2>
            <div className="space-y-2 text-xs font-bold">
              <label className="flex items-center space-x-2"><input type="checkbox" {...register('lockStructure')} /> <span>Lock Structure (prevent reordering/removal of scenes)</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" {...register('allowThemes')} /> <span>Allow Theme Changes</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" {...register('allowPacing')} /> <span>Allow Pacing Adjustments</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" {...register('allowRewards')} /> <span>Allow Reward System Edits</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" {...register('allowAvatars')} /> <span>Allow Avatar Changes</span></label>
            </div>
            <div>
              <label className="font-bold text-xs">Notes (Guidance for AI / Educators)</label>
              <textarea {...register('customizationNotes')} className="w-full border-2 border-black p-2 text-sm h-24" placeholder="Keep transitions calm; avoid sudden audio spikes." />
            </div>
          </div>
          <div className="bg-white border-4 border-black shadow-brutal-xl p-4 text-center">
            <button type="submit" className="bg-chart-1 text-white px-6 py-3 border-2 border-black shadow-brutal font-bold inline-flex items-center space-x-2"><Save className="h-5 w-5"/><span>SAVE MOLD</span></button>
          </div>
        </div>
      </section>
    </form>
  )
}
