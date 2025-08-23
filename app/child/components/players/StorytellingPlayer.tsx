"use client"

import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'

interface StorytellingPlayerProps {
  gameConfig: any
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

export default function StorytellingPlayer({ gameConfig, childId, onComplete, onBack }: StorytellingPlayerProps) {
  const theme = gameConfig?.theme || 'default'

  return (
    <div className="min-h-screen bg-green-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-center text-green-800">
          {theme} Story Time! 📚
        </h1>

        <div></div>
      </div>

      {/* Coming Soon Message */}
      <div className="text-center mt-16">
        <div className="bg-white rounded-lg border-4 border-green-300 shadow-lg p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Story Game Coming Soon!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We're creating an interactive story experience with your {theme}!
            It will feature {gameConfig?.story_template?.characters?.length || 3} characters.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg border-4 border-green-700 shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  )
}
