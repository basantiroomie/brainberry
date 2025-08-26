"use client"

import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface AgeRange {
  min: number
  max: number
}

interface MetaData {
  ageRange: AgeRange
  difficulty: 'Easy' | 'Medium' | 'Hard'
  learnerProfiles: string[]
  executiveFunctionTargets: string[]
  sensoryPreferences: string[]
  skillTargets: string[]
}

interface MetaDataEditorProps {
  meta: MetaData
  onChange: (meta: MetaData) => void
  validationErrors: any[]
}

export function MetaDataEditor({ meta, onChange, validationErrors }: MetaDataEditorProps) {
  const [newSkillTarget, setNewSkillTarget] = useState('')
  const [newExecFunction, setNewExecFunction] = useState('')
  const [newSensoryPref, setNewSensoryPref] = useState('')

  const updateMeta = (updates: Partial<MetaData>) => {
    onChange({ ...meta, ...updates })
  }

  const addArrayItem = (field: keyof MetaData, value: string, setter: (val: string) => void) => {
    if (!value.trim()) return
    const currentArray = (meta[field] as string[]) || []
    if (!currentArray.includes(value.trim())) {
      updateMeta({ [field]: [...currentArray, value.trim()] })
    }
    setter('')
  }

  const removeArrayItem = (field: keyof MetaData, value: string) => {
    const currentArray = (meta[field] as string[]) || []
    updateMeta({ [field]: currentArray.filter(item => item !== value) })
  }

  const learnerProfileOptions = [
    { value: 'ASD', label: 'Autism Spectrum Disorder', description: 'Children with autism-related needs' },
    { value: 'ADHD', label: 'ADHD', description: 'Attention deficit hyperactivity disorder' },
    { value: 'HYBRID', label: 'Multiple Diagnoses', description: 'Children with combined conditions' },
    { value: 'NT', label: 'Neurotypical', description: 'Typically developing children' },
    { value: 'LD', label: 'Learning Differences', description: 'Various learning disabilities' }
  ]

  const commonExecutiveFunctions = [
    'Working Memory',
    'Inhibitory Control',
    'Cognitive Flexibility',
    'Attention Control',
    'Planning & Organization',
    'Self-Monitoring',
    'Emotional Regulation',
    'Task Initiation'
  ]

  const commonSensoryPreferences = [
    'Low Audio',
    'High Contrast',
    'Reduced Motion',
    'Tactile Feedback',
    'Visual Cues',
    'Auditory Processing',
    'Sensory Breaks',
    'Calming Colors'
  ]

  return (
    <div className="space-y-6">
      {/* Age Range & Difficulty */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Basic Demographics</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-sm mb-1 block">Minimum Age</label>
            <select
              value={meta.ageRange.min}
              onChange={(e) => updateMeta({ 
                ageRange: { ...meta.ageRange, min: parseInt(e.target.value) }
              })}
              className="w-full border-2 border-black p-3 font-bold"
            >
              {Array.from({ length: 15 }, (_, i) => i + 3).map(age => (
                <option key={age} value={age}>{age} years</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="font-bold text-sm mb-1 block">Maximum Age</label>
            <select
              value={meta.ageRange.max}
              onChange={(e) => updateMeta({ 
                ageRange: { ...meta.ageRange, max: parseInt(e.target.value) }
              })}
              className="w-full border-2 border-black p-3 font-bold"
            >
              {Array.from({ length: 15 }, (_, i) => i + 3).map(age => (
                <option key={age} value={age}>{age} years</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="font-bold text-sm mb-1 block">Difficulty Level</label>
            <select
              value={meta.difficulty}
              onChange={(e) => updateMeta({ 
                difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' 
              })}
              className="w-full border-2 border-black p-3 font-bold"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Learner Profiles */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Target Learner Profiles</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select which types of learners this mold is designed to support:
        </p>
        
        <div className="space-y-3">
          {learnerProfileOptions.map((option) => (
            <label key={option.value} className="flex items-start space-x-3 border-2 border-gray-200 p-3 rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={meta.learnerProfiles.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateMeta({ learnerProfiles: [...meta.learnerProfiles, option.value] })
                  } else {
                    updateMeta({ learnerProfiles: meta.learnerProfiles.filter(p => p !== option.value) })
                  }
                }}
                className="mt-1 border-2 border-black"
              />
              
              <div>
                <div className="font-bold text-sm">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Executive Function Targets */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Executive Function Targets</h2>
        <p className="text-sm text-gray-600 mb-4">
          Which executive functions does this mold specifically target and develop?
        </p>
        
        {/* Quick Add Common Functions */}
        <div className="mb-4">
          <div className="text-sm font-bold mb-2">Common Functions:</div>
          <div className="flex flex-wrap gap-2">
            {commonExecutiveFunctions.map((func) => (
              <button
                key={func}
                onClick={() => addArrayItem('executiveFunctionTargets', func, setNewExecFunction)}
                disabled={meta.executiveFunctionTargets.includes(func)}
                className="px-3 py-1 text-xs border-2 border-black font-bold disabled:opacity-50 disabled:bg-gray-200 bg-blue-100 hover:bg-blue-200"
              >
                {func}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Addition */}
        <div className="flex space-x-2 mb-4">
          <input
            value={newExecFunction}
            onChange={(e) => setNewExecFunction(e.target.value)}
            placeholder="Add custom executive function target"
            className="flex-1 border-2 border-black p-2 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addArrayItem('executiveFunctionTargets', newExecFunction, setNewExecFunction)
              }
            }}
          />
          <button
            onClick={() => addArrayItem('executiveFunctionTargets', newExecFunction, setNewExecFunction)}
            className="px-4 py-2 bg-blue-500 text-white border-2 border-black shadow-brutal font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {/* Selected Functions */}
        <div className="flex flex-wrap gap-2">
          {meta.executiveFunctionTargets.map((target) => (
            <span
              key={target}
              className="inline-flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 border-2 border-black font-bold text-sm"
            >
              <span>{target}</span>
              <button
                onClick={() => removeArrayItem('executiveFunctionTargets', target)}
                className="text-white hover:text-red-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Sensory Preferences */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Sensory Considerations</h2>
        <p className="text-sm text-gray-600 mb-4">
          What sensory preferences or accommodations does this mold support?
        </p>
        
        {/* Quick Add Common Preferences */}
        <div className="mb-4">
          <div className="text-sm font-bold mb-2">Common Preferences:</div>
          <div className="flex flex-wrap gap-2">
            {commonSensoryPreferences.map((pref) => (
              <button
                key={pref}
                onClick={() => addArrayItem('sensoryPreferences', pref, setNewSensoryPref)}
                disabled={meta.sensoryPreferences.includes(pref)}
                className="px-3 py-1 text-xs border-2 border-black font-bold disabled:opacity-50 disabled:bg-gray-200 bg-green-100 hover:bg-green-200"
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Addition */}
        <div className="flex space-x-2 mb-4">
          <input
            value={newSensoryPref}
            onChange={(e) => setNewSensoryPref(e.target.value)}
            placeholder="Add custom sensory preference"
            className="flex-1 border-2 border-black p-2 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addArrayItem('sensoryPreferences', newSensoryPref, setNewSensoryPref)
              }
            }}
          />
          <button
            onClick={() => addArrayItem('sensoryPreferences', newSensoryPref, setNewSensoryPref)}
            className="px-4 py-2 bg-green-500 text-white border-2 border-black shadow-brutal font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {/* Selected Preferences */}
        <div className="flex flex-wrap gap-2">
          {meta.sensoryPreferences.map((pref) => (
            <span
              key={pref}
              className="inline-flex items-center space-x-1 bg-green-500 text-white px-3 py-1 border-2 border-black font-bold text-sm"
            >
              <span>{pref}</span>
              <button
                onClick={() => removeArrayItem('sensoryPreferences', pref)}
                className="text-white hover:text-red-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Skill Targets */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Therapeutic Skill Targets</h2>
        <p className="text-sm text-gray-600 mb-4">
          What specific therapeutic or educational skills does this mold develop?
        </p>
        
        <div className="flex space-x-2 mb-4">
          <input
            value={newSkillTarget}
            onChange={(e) => setNewSkillTarget(e.target.value)}
            placeholder="e.g., emotion recognition, social turn-taking, fine motor control"
            className="flex-1 border-2 border-black p-2 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addArrayItem('skillTargets', newSkillTarget, setNewSkillTarget)
              }
            }}
          />
          <button
            onClick={() => addArrayItem('skillTargets', newSkillTarget, setNewSkillTarget)}
            className="px-4 py-2 bg-purple-500 text-white border-2 border-black shadow-brutal font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {meta.skillTargets.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center space-x-1 bg-purple-500 text-white px-3 py-1 border-2 border-black font-bold text-sm"
            >
              <span>{skill}</span>
              <button
                onClick={() => removeArrayItem('skillTargets', skill)}
                className="text-white hover:text-red-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
