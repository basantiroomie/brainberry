"use client"

import { useState, useEffect } from 'react'
import MatchingCardPlayer from './players/MatchingCardPlayer'
import SortingGamePlayer from './players/SortingGamePlayer'
import { GameConfig } from '../../../types/game'
import { logger } from '../../../utils/logger'

interface PolymorphicGamePlayerProps {
  personalizedMoldId: string
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

export default function PolymorphicGamePlayer({ 
  personalizedMoldId, 
  childId, 
  onComplete,
  onBack 
}: PolymorphicGamePlayerProps) {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPersonalizedGame()
  }, [personalizedMoldId])

  async function loadPersonalizedGame() {
    try {
      setLoading(true)
      logger.info('Loading personalized game', 'GAME', { personalizedMoldId })
      
      const response = await fetch(`/api/personalized-molds/${personalizedMoldId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load game`)
      }
      
      const data = await response.json()
      setGameConfig(data.config)
      setError(null)
      
      logger.info('Personalized game loaded successfully', 'GAME', { 
        personalizedMoldId,
        gameType: data.config?.game_type 
      })
    } catch (err) {
      logger.error('Error loading personalized game', err, 'GAME')
      setError('Failed to load your personalized game 😢')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Loading your personalized game... 🎮</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-red-800 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg border-4 border-blue-700 shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all"
          >
            Go Back 🏠
          </button>
        </div>
      </div>
    )
  }

  if (!gameConfig) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl font-bold text-gray-800">No game configuration found 🤔</p>
      </div>
    )
  }

  // Route to appropriate player based on game type
  const renderPlayer = () => {
    switch (gameConfig.game_type) {
      case 'matching_cards':
        return (
          <MatchingCardPlayer
            gameConfig={gameConfig}
            childId={childId}
            onComplete={onComplete}
            onBack={onBack}
          />
        )
      
      case 'sorting':
        return (
          <SortingGamePlayer
            gameConfig={gameConfig}
            childId={childId}
            onComplete={onComplete}
            onBack={onBack}
          />
        )
      
      default:
        logger.warn('Unsupported game type', 'GAME', { 
          gameType: gameConfig.game_type,
          personalizedMoldId 
        })
        return (
          <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-4">
                Game type "{gameConfig.game_type}" is not yet implemented 🚧
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Available games: Matching Cards, Sorting Game
              </p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg border-4 border-blue-700 shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all"
              >
                Go Back 🏠
              </button>
            </div>
          </div>
        )
    }
  }

  return renderPlayer()
}
