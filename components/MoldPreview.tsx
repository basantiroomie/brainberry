"use client"

import { useState } from 'react'
import { Play, RotateCcw, Volume2, VolumeX, Settings, ArrowRight, ArrowLeft } from 'lucide-react'

interface MoldPreviewProps {
  mold: any
}

export function MoldPreview({ mold }: MoldPreviewProps) {
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [playerMode, setPlayerMode] = useState<'child' | 'educator'>('child')

  if (!mold) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
        <p className="text-gray-600">No mold selected for preview</p>
      </div>
    )
  }

  const scene = mold.scenes[currentScene] || {}

  const nextScene = () => {
    if (currentScene < mold.scenes.length - 1) {
      setCurrentScene(currentScene + 1)
    }
  }

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  const resetPreview = () => {
    setCurrentScene(0)
    setIsPlaying(false)
  }

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Game Preview</h2>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">View as:</span>
              <select
                value={playerMode}
                onChange={(e) => setPlayerMode(e.target.value as 'child' | 'educator')}
                className="border-2 border-black p-2 font-bold text-sm"
              >
                <option value="child">Child Player</option>
                <option value="educator">Educator Review</option>
              </select>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 border-2 border-black font-bold ${
                soundEnabled ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            
            <button
              onClick={resetPreview}
              className="px-4 py-2 bg-orange-500 text-white border-2 border-black shadow-brutal font-bold text-sm flex items-center space-x-1"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 border-2 border-black shadow-brutal font-bold text-sm flex items-center space-x-1 ${
                isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              <Play className="h-4 w-4" />
              <span>{isPlaying ? 'Stop' : 'Play'}</span>
            </button>
          </div>
        </div>

        {/* Game Info Header */}
        <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{mold.name}</h3>
              <p className="text-sm text-gray-600">{mold.primaryObjective}</p>
            </div>
            
            <div className="text-right text-sm">
              <div className="font-bold">Scene {currentScene + 1} of {mold.scenes.length}</div>
              <div className="text-gray-600">{scene.title}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Preview Area */}
      <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden">
        {/* Game Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-purple-500 font-bold text-sm">{currentScene + 1}</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">{scene.title}</h2>
                {playerMode === 'educator' && (
                  <div className="text-sm opacity-75">Preview Mode - Educator View</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {mold.meta?.ageRange && (
                <span className="bg-white text-purple-500 px-2 py-1 rounded text-xs font-bold">
                  Ages {mold.meta.ageRange.min}-{mold.meta.ageRange.max}
                </span>
              )}
              <span className="bg-white text-purple-500 px-2 py-1 rounded text-xs font-bold">
                {mold.meta?.difficulty || 'Medium'}
              </span>
            </div>
          </div>
        </div>

        {/* Scene Content */}
        <div className="p-8 min-h-96">
          {/* Narrative */}
          {scene.narrative && (
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded mb-6">
              <h3 className="font-bold text-blue-800 mb-2">Story</h3>
              <p className="text-blue-700">{scene.narrative}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded mb-6">
            <h3 className="font-bold text-green-800 mb-2">Instructions</h3>
            <p className="text-green-700">{scene.instructions || 'No instructions provided'}</p>
          </div>

          {/* Game Simulation Area */}
          <div className="bg-gray-100 border-2 border-gray-300 rounded p-8 text-center min-h-48">
            <div className="text-gray-500 mb-4">
              <Settings className="h-16 w-16 mx-auto opacity-50" />
            </div>
            
            <h3 className="font-bold text-lg text-gray-700 mb-2">Game Simulation</h3>
            <p className="text-gray-600 mb-4">
              This is where the actual game content would appear based on your mold structure.
            </p>
            
            {/* Show Assets if Available */}
            {scene.assets && scene.assets.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-sm text-gray-700 mb-2">Scene Assets:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {scene.assets.map((asset: any) => (
                    <span
                      key={asset.id}
                      className="bg-white border-2 border-gray-300 px-3 py-1 rounded text-xs font-bold"
                    >
                      {asset.type.toUpperCase()}: {asset.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Game Type: {mold.experienceType} • Structure: {mold.structureType}
            </div>
          </div>

          {/* Reinforcement */}
          {scene.reinforcement && (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded mt-6">
              <h3 className="font-bold text-yellow-800 mb-2">Positive Reinforcement</h3>
              <p className="text-yellow-700">{scene.reinforcement}</p>
            </div>
          )}

          {/* Educator View: Additional Info */}
          {playerMode === 'educator' && (
            <div className="mt-6 bg-purple-50 border-2 border-purple-200 p-4 rounded">
              <h3 className="font-bold text-purple-800 mb-3">Educator Notes</h3>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-purple-700 mb-1">Pacing Support:</h4>
                  <ul className="text-purple-600 space-y-1">
                    {scene.pacingHints?.calmMode && <li>✓ Calm mode enabled</li>}
                    {scene.pacingHints?.fastMode && <li>✓ Fast mode enabled</li>}
                    {!scene.pacingHints?.calmMode && !scene.pacingHints?.fastMode && (
                      <li>No adaptive pacing</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-purple-700 mb-1">Learning Targets:</h4>
                  <ul className="text-purple-600 space-y-1">
                    {mold.meta?.executiveFunctionTargets?.slice(0, 3).map((target: string) => (
                      <li key={target}>• {target}</li>
                    )) || <li>No specific targets defined</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-gray-100 border-t-2 border-black p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevScene}
              disabled={currentScene === 0}
              className="px-4 py-2 bg-gray-500 text-white border-2 border-black shadow-brutal font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              {mold.scenes.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentScene(index)}
                  className={`w-8 h-8 border-2 border-black font-bold text-sm ${
                    currentScene === index
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={nextScene}
              disabled={currentScene >= mold.scenes.length - 1}
              className="px-4 py-2 bg-blue-500 text-white border-2 border-black shadow-brutal font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Summary */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h3 className="font-bold text-lg mb-4">Preview Summary</h3>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">Game Structure</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• {mold.scenes.length} total scenes</li>
              <li>• {mold.structureType} progression</li>
              <li>• {mold.experienceType} gameplay</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-700 mb-2">Customization</h4>
            <ul className="text-gray-600 space-y-1">
              <li>{mold.customization?.allowThemes ? '✓' : '✗'} Theme changes</li>
              <li>{mold.customization?.allowPacing ? '✓' : '✗'} Pacing adjustments</li>
              <li>{mold.customization?.allowRewards ? '✓' : '✗'} Custom rewards</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-700 mb-2">Target Audience</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Ages {mold.meta?.ageRange?.min}-{mold.meta?.ageRange?.max}</li>
              <li>• {mold.meta?.difficulty} difficulty</li>
              <li>• {mold.meta?.learnerProfiles?.join(', ') || 'All learners'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
