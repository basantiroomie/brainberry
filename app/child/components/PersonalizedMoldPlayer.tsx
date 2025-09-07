"use client"

import { useState, useEffect } from 'react'
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface PersonalizedMoldPlayerProps {
  personalizedMoldId: string
  childId: string
}

interface Card {
  id: number
  pair_id: number
  image_url: string
  label: string
  isFlipped: boolean
  isMatched: boolean
}

export default function PersonalizedMoldPlayer({ personalizedMoldId, childId }: PersonalizedMoldPlayerProps) {
  const [gameConfig, setGameConfig] = useState<any>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameTime, setGameTime] = useState(0)

  useEffect(() => {
    loadPersonalizedGame()
  }, [personalizedMoldId])

  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameComplete])

  async function loadPersonalizedGame() {
    try {
      const response = await fetch(`/api/personalized-molds/${personalizedMoldId}`)
      const data = await response.json()
      
      setGameConfig(data.config)
      initializeCards(data.config.cards)
    } catch (error) {
      console.error('Failed to load personalized game:', error)
    }
  }

  function initializeCards(cardData: any[]) {
    // Create pairs of cards and shuffle
    const gameCards: Card[] = []
    let cardId = 0

    cardData.forEach((cardInfo, index) => {
      // Add two cards for each pair
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
    const shuffled = [...gameCards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }

  function handleCardClick(cardId: number) {
    if (flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return
    if (cards.find(c => c.id === cardId)?.isMatched) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card flip state
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ))

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1)
      checkForMatch(newFlippedCards)
    }
  }

  function checkForMatch(flippedCardIds: number[]) {
    const [card1Id, card2Id] = flippedCardIds
    const card1 = cards.find(c => c.id === card1Id)
    const card2 = cards.find(c => c.id === card2Id)

    console.log('🎮 PersonalizedMoldPlayer - Checking match:', {
      card1: { id: card1?.id, label: card1?.label, pair_id: card1?.pair_id },
      card2: { id: card2?.id, label: card2?.label, pair_id: card2?.pair_id },
      isMatch: card1?.pair_id === card2?.pair_id
    })

    if (card1 && card2 && card1.pair_id === card2.pair_id) {
      // Match found! Keep cards face-up and mark as matched
      console.log('✅ PersonalizedMoldPlayer - Match found! Cards will stay visible')
      setTimeout(() => {
        setCards(prev => prev.map(card => 
          flippedCardIds.includes(card.id) 
            ? { ...card, isMatched: true, isFlipped: false } // Mark as matched but not flipped
            : card
        ))
        
        setMatchedPairs(prev => [...prev, card1.pair_id])
        setScore(prev => prev + 10)
        
        if (soundEnabled && gameConfig?.success_sounds?.match) {
          playSound(gameConfig.success_sounds.match)
        }

        // Check if game is complete
        if (matchedPairs.length + 1 === gameConfig?.cards?.length) {
          setGameComplete(true)
          if (soundEnabled && gameConfig?.success_sounds?.victory) {
            setTimeout(() => playSound(gameConfig.success_sounds.victory), 500)
          }
        }

        setFlippedCards([])
      }, 1000)
    } else {
      // No match - flip cards back to face-down
      console.log('❌ PersonalizedMoldPlayer - No match found! Cards will flip back down')
      setTimeout(() => {
        setCards(prev => prev.map(card => 
          flippedCardIds.includes(card.id) 
            ? { ...card, isFlipped: false }
            : card
        ))
        setFlippedCards([])
        console.log('🔄 PersonalizedMoldPlayer - Cards should now be face down')
      }, 1500)
    }
  }

  function playSound(soundUrl: string) {
    try {
      const audio = new Audio(soundUrl)
      audio.volume = 0.3
      audio.play().catch(e => console.log('Audio play failed:', e))
    } catch (error) {
      console.log('Sound not available:', error)
    }
  }

  function resetGame() {
    setFlippedCards([])
    setMatchedPairs([])
    setMoves(0)
    setScore(0)
    setGameComplete(false)
    setGameTime(0)
    
    if (gameConfig?.cards) {
      initializeCards(gameConfig.cards)
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!gameConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading your special game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: gameConfig.ui_customization?.primary_color + '20' || '#f0f9ff' }}>
      {/* Header */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My {gameConfig.theme} Game</h1>
            <p className="text-sm text-gray-600">Match the pairs to win!</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: gameConfig.ui_customization?.primary_color || '#3b82f6' }}>
                {score}
              </div>
              <div className="text-xs">Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{moves}</div>
              <div className="text-xs">Moves</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(gameTime)}</div>
              <div className="text-xs">Time</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-all"
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              <button
                onClick={resetGame}
                className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-all"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || flippedCards.length === 2}
              className={`aspect-[3/4] border-4 border-black shadow-brutal transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? 'bg-white'
                  : 'bg-blue-500 hover:bg-blue-400'
              } ${
                card.isMatched ? 'ring-4 ring-green-400' : ''
              }`}
              style={{
                backgroundColor: card.isFlipped || card.isMatched 
                  ? 'white' 
                  : gameConfig.ui_customization?.primary_color || '#3b82f6'
              }}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="h-full flex flex-col items-center justify-center p-2">
                  <img
                    src={card.image_url}
                    alt={card.label}
                    className="w-full h-3/4 object-cover rounded border-2 border-gray-300"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className="text-xs font-bold mt-1 text-center">{card.label}</span>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-white text-6xl">?</div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Game Complete Modal */}
      {gameComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: gameConfig.ui_customization?.primary_color || '#3b82f6' }}>
              {gameConfig.ui_customization?.success_message || 'Amazing Job!'}
            </h2>
            
            <div className="space-y-2 mb-6">
              <p className="text-xl">Final Score: <span className="font-bold">{score}</span></p>
              <p className="text-lg">Moves: {moves}</p>
              <p className="text-lg">Time: {formatTime(gameTime)}</p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={resetGame}
                className="flex-1 px-4 py-3 bg-green-500 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Play Again</span>
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-gray-500 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
