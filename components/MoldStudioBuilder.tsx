"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Edit3, ArrowUp, ArrowDown, Copy, Settings, Play } from 'lucide-react'
import { MoldValidationIndicator } from './MoldValidationIndicator'
import { SceneBuilder } from './SceneBuilder'
import { CustomizationSettings } from './CustomizationSettings'
import { MetaDataEditor } from './MetaDataEditor'
import { type Mold, type Scene, type Asset } from '../lib/mold-normalize'

interface ValidationError {
  type: 'critical' | 'warning' | 'info'
  message: string
  section?: string
  field?: string
  sceneIndex?: number
}

interface MoldStudioBuilderProps {
  mold: Mold | null
  onChange: (mold: Mold) => void
  validationErrors: ValidationError[]
}

export function MoldStudioBuilder({ mold, onChange, validationErrors }: MoldStudioBuilderProps) {
  const [activeSection, setActiveSection] = useState<'basic' | 'scenes' | 'customization' | 'metadata'>('basic')
  const [selectedScene, setSelectedScene] = useState<number>(0)

  const createNewMold = (): Mold => {
    const newMold: Mold = {
      id: null,
      name: '',
      category: 'attention',
      structureType: 'linear',
      experienceType: 'puzzle',
      primaryObjective: '',
      rules: '',
      scenes: [
        {
          id: `scene_${Date.now()}`,
          title: 'Introduction',
          narrative: '',
          instructions: '',
          assets: [],
          pacingHints: {},
          reinforcement: ''
        }
      ],
      customization: {
        lockStructure: false,
        allowThemes: true,
        allowPacing: true,
        allowRewards: true,
        allowAvatars: true,
        notes: ''
      },
      meta: {
        ageRange: { min: 5, max: 12 },
        difficulty: 'Easy',
        learnerProfiles: ['ASD'],
        executiveFunctionTargets: [],
        sensoryPreferences: [],
        skillTargets: []
      },
      version: 1
    }
    onChange(newMold)
    return newMold
  }

  useEffect(() => {
    if (!mold) {
      createNewMold()
    }
  }, [mold, onChange])

  // Map scene validation counts (must be declared before any early returns to keep hook order stable)
  const sceneErrorMap = useMemo(() => {
    const map = new Map<number, { critical: number; warning: number; info: number }>()
    for (const e of validationErrors) {
      if (e.section === 'scenes' && typeof e.sceneIndex === 'number') {
        const cur = map.get(e.sceneIndex) || { critical: 0, warning: 0, info: 0 }
        // increment counts safely
        if (e.type === 'critical') cur.critical++
        else if (e.type === 'warning') cur.warning++
        else cur.info++
        map.set(e.sceneIndex, cur)
      }
    }
    return map
  }, [validationErrors])

  if (!mold) return null

  const updateMold = (updates: Partial<Mold>) => {
    onChange({ ...mold!, ...updates })
  }

  const updateScene = (sceneIndex: number, updates: Partial<Scene>) => {
    const newScenes = [...mold!.scenes]
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], ...updates }
    updateMold({ scenes: newScenes })
  }

  const addScene = () => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      title: `Scene ${mold!.scenes.length + 1}`,
      narrative: '',
      instructions: '',
      assets: [],
      pacingHints: {},
      reinforcement: ''
    }
    updateMold({ scenes: [...mold!.scenes, newScene] })
    setSelectedScene(mold!.scenes.length)
  }

  const deleteScene = (index: number) => {
    if (mold!.scenes.length <= 1) return
    const newScenes = mold!.scenes.filter((_: Scene, i: number) => i !== index)
    updateMold({ scenes: newScenes })
    setSelectedScene(Math.max(0, index - 1))
  }

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newScenes = [...mold!.scenes]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newScenes.length) return
    
    [newScenes[index], newScenes[newIndex]] = [newScenes[newIndex], newScenes[index]]
    updateMold({ scenes: newScenes })
    setSelectedScene(newIndex)
  }

  const duplicateScene = (index: number) => {
    const sceneToClone: Scene = { ...mold!.scenes[index], id: `scene_${Date.now()}` }
    const newScenes = [...mold!.scenes]
    newScenes.splice(index + 1, 0, sceneToClone)
    updateMold({ scenes: newScenes })
    setSelectedScene(index + 1)
  }

  const sectionErrors = (section: string): ValidationError[] => {
    return validationErrors.filter(error => error.section === section)
  }

  // sceneErrorMap declared above

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Edit3 },
    { id: 'scenes', label: 'Scenes & Flow', icon: Play },
    { id: 'customization', label: 'Customization', icon: Settings },
    { id: 'metadata', label: 'Learning Goals', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex space-x-2 mb-4">
          {sections.map((section) => {
            const Icon = section.icon
            const errors = sectionErrors(section.id)
            const hasErrors = errors.length > 0
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`px-4 py-2 border-2 border-black font-bold text-sm transition-all flex items-center space-x-2 ${
                  activeSection === section.id
                    ? 'bg-purple-500 text-white shadow-brutal'
                    : 'bg-white hover:bg-gray-100'
                } ${hasErrors ? 'border-red-500' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
                {hasErrors && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {errors.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        <MoldValidationIndicator errors={validationErrors} />
      </div>

      {/* Basic Information */}
      {activeSection === 'basic' && (
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-sm mb-1 block">Game Name *</label>
              <input
                value={mold.name}
                onChange={(e) => updateMold({ name: e.target.value })}
                className="w-full border-2 border-black p-3 font-bold"
                placeholder="Focus Quest Adventure"
              />
            </div>
            
            <div>
              <label className="font-bold text-sm mb-1 block">Category</label>
              <select
                value={mold.category}
                onChange={(e) => updateMold({ category: e.target.value })}
                className="w-full border-2 border-black p-3 font-bold"
              >
                <option value="attention">Attention & Focus</option>
                <option value="memory">Memory & Recall</option>
                <option value="social">Social Skills</option>
                <option value="emotional">Emotional Regulation</option>
                <option value="communication">Communication</option>
                <option value="motor">Motor Skills</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-sm mb-1 block">Structure Type</label>
              <select
                value={mold.structureType}
                onChange={(e) => updateMold({ structureType: e.target.value })}
                className="w-full border-2 border-black p-3 font-bold"
              >
                <option value="linear">Linear (Step by Step)</option>
                <option value="branching">Branching (Multiple Paths)</option>
                <option value="timed">Timed Challenges</option>
                <option value="open-world">Open Exploration</option>
              </select>
            </div>
            
            <div>
              <label className="font-bold text-sm mb-1 block">Experience Type</label>
              <select
                value={mold.experienceType}
                onChange={(e) => updateMold({ experienceType: e.target.value })}
                className="w-full border-2 border-black p-3 font-bold"
              >
                <option value="puzzle">Puzzle & Problem Solving</option>
                <option value="action">Action & Reaction</option>
                <option value="story">Story & Narrative</option>
                <option value="creative">Creative Expression</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-sm mb-1 block">Primary Learning Objective *</label>
            <textarea
              value={mold.primaryObjective}
              onChange={(e) => updateMold({ primaryObjective: e.target.value })}
              className="w-full border-2 border-black p-3 h-20"
              placeholder="Help children develop sustained attention and focus through engaging memory challenges..."
            />
          </div>

          <div>
            <label className="font-bold text-sm mb-1 block">Game Rules & Mechanics</label>
            <textarea
              value={mold.rules}
              onChange={(e) => updateMold({ rules: e.target.value })}
              className="w-full border-2 border-black p-3 h-24"
              placeholder="1. Child sees cards face down
2. Click to flip and remember positions
3. Match pairs to score points..."
            />
          </div>
        </div>
      )}

      {/* Scenes & Flow */}
      {activeSection === 'scenes' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scene List */}
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Game Scenes</h2>
              <button
                onClick={addScene}
                className="bg-green-500 text-white px-3 py-1 border-2 border-black shadow-brutal font-bold text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {mold!.scenes.map((scene: Scene, index: number) => {
                const counts = sceneErrorMap.get(index) || { critical: 0, warning: 0, info: 0 }
                const criticalCount = counts.critical
                const warningCount = counts.warning
                return (
                <div
                  key={scene.id}
                  className={`p-3 border-2 border-black cursor-pointer transition-all ${
                    selectedScene === index
                      ? 'bg-purple-100 shadow-brutal'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedScene(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{scene.title || `Scene ${index + 1}`}</div>
                      <div className="text-xs text-gray-600 truncate">{scene.instructions || 'No instructions yet'}</div>
                      {(criticalCount > 0 || warningCount > 0) && (
                        <div className="mt-1 flex items-center gap-2">
                          {criticalCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                              {criticalCount} critical
                            </span>
                          )}
                          {warningCount > 0 && (
                            <span className="text-[10px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                              {warningCount} warn
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveScene(index, 'up') }}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); moveScene(index, 'down') }}
                        disabled={index === mold!.scenes.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateScene(index) }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteScene(index) }}
                        disabled={mold!.scenes.length <= 1}
                        className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Scene Editor */}
          <div className="lg:col-span-2">
            <SceneBuilder
              scene={mold!.scenes[selectedScene] as any}
              onChange={(updates: any) => updateScene(selectedScene, updates)}
              validationErrors={validationErrors.filter(e => e.sceneIndex === selectedScene)}
            />
          </div>
        </div>
      )}

      {/* Customization Settings */}
      {activeSection === 'customization' && (
        <CustomizationSettings
          customization={mold!.customization}
          onChange={(customization: any) => updateMold({ customization })}
          validationErrors={sectionErrors('customization')}
        />
      )}

      {/* Metadata & Learning Goals */}
      {activeSection === 'metadata' && (
        <MetaDataEditor
          meta={mold!.meta as any}
          onChange={(meta: any) => updateMold({ meta })}
          validationErrors={sectionErrors('metadata')}
        />
      )}
    </div>
  )
}