"use client"

import { useState } from 'react'
import { ArrowLeft, Palette } from 'lucide-react'

interface DrawingGamePlayerProps {
  gameConfig: any
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

export default function DrawingGamePlayer({ gameConfig, childId, onComplete, onBack }: DrawingGamePlayerProps) {
  const theme = gameConfig?.theme || 'default'

  return (
    <div className="min-h-screen bg-pink-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-center text-pink-800">
          Draw Your {theme}! 🎨
        </h1>

        <div></div>
      </div>

      {/* Coming Soon Message */}
      <div className="text-center mt-16">
        <div className="bg-white rounded-lg border-4 border-pink-300 shadow-lg p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-pink-800 mb-4">
            Drawing Game Coming Soon!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We're building a fun drawing game where you can create your own {theme} art!
            It will have {gameConfig?.drawing_prompts?.length || 5} different prompts.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg border-4 border-pink-700 shadow-lg hover:bg-pink-600 transform hover:scale-105 transition-all"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  )
}
