"use client"

import { useState, useEffect } from 'react'
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft } from 'lucide-react'
import { useImagePreloader, SmartImage } from '@/components/ImagePreloader'
import OptimizedCard from '@/components/OptimizedCard'
import GameLoadingScreen from '@/components/GameLoadingScreen'
import { GameConfig, Card } from '../../../../types/game'
import { logger } from '../../../../utils/logger'

interface MatchingCardPlayerProps {
  gameConfig: GameConfig
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

interface GameCard extends Card {
  isFlipped: boolean
  isMatched: boolean
}

export default function MatchingCardPlayer({ gameConfig, childId, onComplete, onBack }: MatchingCardPlayerProps) {
  const [cards, setCards] = useState<GameCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameTime, setGameTime] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [consecutiveMatches, setConsecutiveMatches] = useState(0)
  const [imagesReady, setImagesReady] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Extract image URLs for preloading
  const imageUrls = gameConfig?.cards?.map((card) => card.image_url) || []
  const fallbackEmojis = gameConfig?.cards?.map((card) => 
    card.ai_generation?.fallback_emoji || '⭐'
  ) || []

  // Preload images with enhanced caching
  const { allLoaded, getCachedUrl } = useImagePreloader({
    images: imageUrls,
    onAllLoaded: () => setImagesReady(true),
    onProgress: (loaded, total) => setLoadingProgress(loaded),
    fallbackEmojis
  })

  useEffect(() => {
    if (gameConfig?.cards && imagesReady) {
      initializeCards(gameConfig.cards)
    }
  }, [gameConfig, imagesReady])

  useEffect(() => {
    if (gameStarted && !gameComplete) {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameStarted, gameComplete])

  function initializeCards(cardData: any[]) {
    // Create pairs of cards and shuffle them
    const gameCards: Card[] = []
    let cardId = 1

    cardData.forEach(cardInfo => {
      // Add two identical cards for each pair
      for (let i = 0; i < 2; i++) {
        gameCards.push({
          id: cardId++,
          pair_id: cardInfo.pair_id,
          image_url: cardInfo.image_url,
          label: cardInfo.label,
          isFlipped: false,
          isMatched: false
        })
      }
    })

    // Shuffle the cards
    const shuffledCards = [...gameCards].sort(() => Math.random() - 0.5)
    setCards(shuffledCards)
  }

  function handleCardClick(cardId: number) {
    if (!gameStarted) {
      setGameStarted(true)
    }

    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return
    }

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1)
      checkForMatch(newFlippedCards)
    }
  }

  function checkForMatch(flippedCardIds: number[]) {
    const [firstId, secondId] = flippedCardIds
    const firstCard = cards.find(c => c.id === firstId)
    const secondCard = cards.find(c => c.id === secondId)

    if (firstCard && secondCard && firstCard.pair_id === secondCard.pair_id) {
      // Match found!
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          flippedCardIds.includes(c.id) ? { ...c, isMatched: true } : c
        ))
        setMatchedPairs(prev => [...prev, firstCard.pair_id])
        setScore(prev => prev + 10)
        setConsecutiveMatches(prev => prev + 1)
        setFlippedCards([])

        // Show encouragement for consecutive matches
        if (consecutiveMatches >= 2) {
          showEncouragementFeedback()
        }

        // Check if game is complete
        const totalPairs = gameConfig.cards?.length || 0
        if (matchedPairs.length + 1 >= totalPairs) {
          setGameComplete(true)
          onComplete?.()
          logger.game('Game completed', undefined, { 
            totalPairs, 
            moves, 
            score, 
            gameTime 
          })
        }

        // Play success sound
        if (soundEnabled) {
          playSound('match')
        }
      }, 1000)
    } else {
      // No match - flip cards back
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          flippedCardIds.includes(c.id) ? { ...c, isFlipped: false } : c
        ))
        setFlippedCards([])
        setConsecutiveMatches(0) // Reset streak
      }, 1500)
    }
  }

  function showEncouragementFeedback() {
    const messages = gameConfig?.ui_customization?.encouragement_messages || [
      "Great job!", "You're on fire!", "Keep it up!", "Amazing work!"
    ]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    setEncouragementMessage(randomMessage)
    setShowEncouragement(true)
    
    setTimeout(() => {
      setShowEncouragement(false)
    }, 2000)
  }

  function playSound(soundType: 'match' | 'victory' | 'flip') {
    // In a real implementation, you would play actual audio files
    // For now, we'll just log the sound action
    console.log(`Playing ${soundType} sound for ${theme} theme`)
    
    // Example of how to play real sounds:
    // const audio = new Audio(gameConfig?.success_sounds?.[soundType])
    // audio.play().catch(console.error)
  }

  function resetGame() {
    setGameStarted(false)
    setGameComplete(false)
    setMoves(0)
    setScore(0)
    setGameTime(0)
    setFlippedCards([])
    setMatchedPairs([])
    setConsecutiveMatches(0)
    setShowEncouragement(false)
    if (gameConfig?.cards) {
      initializeCards(gameConfig.cards)
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const theme = gameConfig?.theme || 'default'
  const primaryColor = gameConfig?.ui_customization?.primary_color || '#3b82f6'

  // Show loading screen while images are loading
  if (!imagesReady) {
    return (
      <GameLoadingScreen 
        progress={loadingProgress}
        total={imageUrls.length}
        gameTitle="Matching Cards Game"
        theme={theme}
      />
    )
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{ backgroundColor: `${primaryColor}20` }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-center" style={{ color: primaryColor }}>
          {gameConfig?.title || `${theme} Matching Game`} 🎮
        </h1>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 bg-white rounded-lg border-4 border-gray-300 shadow-lg hover:scale-105 transition-all"
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Game Stats */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="bg-white p-3 rounded-lg border-4 border-gray-300 shadow-lg">
          <div className="text-lg font-bold text-gray-800">⏱️ {formatTime(gameTime)}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border-4 border-gray-300 shadow-lg">
          <div className="text-lg font-bold text-gray-800">🎯 {moves} moves</div>
        </div>
        <div className="bg-white p-3 rounded-lg border-4 border-gray-300 shadow-lg">
          <div className="text-lg font-bold text-gray-800">⭐ {score} points</div>
        </div>
        <div className="bg-white p-3 rounded-lg border-4 border-gray-300 shadow-lg">
          <div className="text-lg font-bold text-gray-800">🎯 {matchedPairs.length}/{gameConfig?.cards?.length || 0}</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-4xl mx-auto">
        {!gameStarted && !gameComplete && (
          <div className="text-center mb-6">
            <p className="text-xl font-bold text-gray-800 mb-4">
              Ready to play your personalized {theme} game? 🎉
            </p>
            <button
              onClick={() => setGameStarted(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-lg border-4 border-green-700 shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all mx-auto"
            >
              <Play size={24} />
              Start Game!
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {cards.map(card => (
            <OptimizedCard
              key={card.id}
              card={card}
              theme={theme}
              primaryColor={primaryColor}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>

        {/* Game Complete */}
        {gameComplete && (
          <div className="text-center mt-8 p-6 bg-white rounded-lg border-4 border-green-500 shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-lg text-gray-800 mb-4">
              {gameConfig?.ui_customization?.success_message || `You matched all the ${theme}!`}
            </p>
            <div className="text-sm text-gray-600 mb-4">
              Time: {formatTime(gameTime)} | Moves: {moves} | Score: {score}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-lg border-4 border-blue-700 shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all"
              >
                <RotateCcw size={20} />
                Play Again
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
              >
                Back to Games
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Encouragement Overlay */}
      {showEncouragement && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div 
            className="px-8 py-4 rounded-lg border-4 shadow-lg transform animate-bounce"
            style={{ 
              backgroundColor: primaryColor, 
              borderColor: gameConfig?.ui_customization?.secondary_color || '#ffffff',
              color: 'white'
            }}
          >
            <div className="text-2xl font-bold text-center">
              {encouragementMessage} 🎉
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
