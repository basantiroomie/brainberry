"use client"

import { useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'

interface PuzzleGamePlayerProps {
  gameConfig: any
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

export default function PuzzleGamePlayer({ gameConfig, childId, onComplete, onBack }: PuzzleGamePlayerProps) {
  const [gameComplete, setGameComplete] = useState(false)
  
  const theme = gameConfig?.theme || 'default'

  return (
    <div className="min-h-screen bg-blue-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-center text-blue-800">
          {theme} Puzzle! 🧩
        </h1>

        <div></div>
      </div>

      {/* Coming Soon Message */}
      <div className="text-center mt-16">
        <div className="bg-white rounded-lg border-4 border-blue-300 shadow-lg p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            Puzzle Game Coming Soon!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We're working on your personalized {theme} puzzle game. 
            It will have {gameConfig?.main_image?.pieces || 12} pieces!
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg border-4 border-blue-700 shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  )
}
