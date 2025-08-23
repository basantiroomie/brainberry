"use client"

import { useState, useEffect } from 'react'
import { Gamepad, Sparkles, ArrowLeft } from 'lucide-react'
import MoldPersonalizationWizard from './MoldPersonalizationWizard'
import PolymorphicGamePlayer from './PolymorphicGamePlayer'
import { imageCache } from '@/lib/image-cache'

interface PlayTabProps {
  childId: string
}

type ViewMode = 'dashboard' | 'personalize' | 'play-personalized'

export default function PlayTab({ childId }: { childId: string }) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedMold, setSelectedMold] = useState<any>(null)
  const [selectedPersonalizedGame, setSelectedPersonalizedGame] = useState<string | null>(null)
  const [availableMolds, setAvailableMolds] = useState<any[]>([])
  const [personalizedGames, setPersonalizedGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (childId) {
      loadGameData()
    }

    // Cleanup function to manage cache when component unmounts
    return () => {
      // Get cache stats before cleanup for logging
      const stats = imageCache.getCacheStats()
      if (stats.cachedImages > 0) {
        console.log(`PlayTab unmounting: ${stats.cachedImages} images in cache (${Math.round(stats.totalSize / 1024)}KB)`)
      }
      // Note: We don't clear all cache here as images might be reused
      // Cache will be cleared when specific games are deleted
    }
  }, [childId])

  async function loadGameData() {
    if (!childId) {
      console.error('No childId provided')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      // Load available molds and personalized games using child-specific APIs
      const [moldsResponse, personalizedResponse] = await Promise.all([
        fetch('/api/child-molds'),
        fetch(`/api/child-personalized-molds?child_id=${childId}`)
      ])

      // Check if responses are JSON before parsing
      let moldsData, personalizedData
      
      if (moldsResponse.ok) {
        const moldsText = await moldsResponse.text()
        try {
          moldsData = JSON.parse(moldsText)
        } catch (e) {
          console.error('Failed to parse molds JSON:', e)
          moldsData = []
        }
      } else {
        console.error('Molds API failed:', moldsResponse.status, moldsResponse.statusText)
        moldsData = []
      }

      if (personalizedResponse.ok) {
        const personalizedText = await personalizedResponse.text()
        try {
          personalizedData = JSON.parse(personalizedText)
        } catch (e) {
          console.error('Failed to parse personalized JSON:', e)
          personalizedData = []
        }
      } else {
        console.error('Personalized API failed:', personalizedResponse.status, personalizedResponse.statusText)
        personalizedData = []
      }

      console.log('Molds data:', moldsData)
      console.log('Personalized data:', personalizedData)

      setAvailableMolds(Array.isArray(moldsData) ? moldsData : [])
      setPersonalizedGames(Array.isArray(personalizedData) ? personalizedData : [])
    } catch (error) {
      console.error('Error loading game data:', error)
      setAvailableMolds([])
      setPersonalizedGames([])
    } finally {
      setLoading(false)
    }
  }

  async function deletePersonalizedGame(gameId: string) {
    try {
      // Find the game to get its image URLs for cache cleanup
      const gameToDelete = personalizedGames.find(g => g.id === gameId)
      
      const response = await fetch(`/api/personalized-molds/${gameId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Clear cached images for this game
        if (gameToDelete?.game_data) {
          const imageUrls = extractImageUrls(gameToDelete.game_data)
          if (imageUrls.length > 0) {
            imageCache.clearImages(imageUrls)
            console.log(`Cleared ${imageUrls.length} cached images for deleted game`)
          }
        }
        
        // Refresh the game data
        await loadGameData()
      } else {
        console.error('Failed to delete game')
      }
    } catch (error) {
      console.error('Error deleting game:', error)
    }
  }

  // Helper function to extract image URLs from game data
  function extractImageUrls(gameData: any): string[] {
    const urls: string[] = []
    
    if (gameData?.cards) {
      // Matching card game
      gameData.cards.forEach((card: any) => {
        if (card.image_url) urls.push(card.image_url)
      })
    }
    
    if (gameData?.categories) {
      // Sorting game
      gameData.categories.forEach((category: any) => {
        if (category.items) {
          category.items.forEach((item: any) => {
            if (item.image_url) urls.push(item.image_url)
          })
        }
      })
    }
    
    return urls
  }

  function handlePersonalizationComplete(personalizedMoldId: string) {
    // Immediately play the newly created personalized game
    setSelectedPersonalizedGame(personalizedMoldId)
    setViewMode('play-personalized')
    setSelectedMold(null)
    
    // Also refresh the game data for the dashboard
    loadGameData()
  }

  function handleGameComplete() {
    // Game completed - let the game component handle its own completion screen
    // The game will show scores and completion data before user decides to go back
    console.log('Game completed successfully!')
    // Don't automatically redirect - let the user see their completion screen first
  }

  function handleBackToDashboard() {
    setViewMode('dashboard')
    setSelectedMold(null)
    setSelectedPersonalizedGame(null)
  }

  // Render different views based on mode
  if (viewMode === 'personalize' && selectedMold) {
    return (
      <MoldPersonalizationWizard
        moldId={selectedMold.id}
        childId={childId}
        onComplete={(personalizedMoldId: string) => {
          handlePersonalizationComplete(personalizedMoldId)
        }}
      />
    )
  }

  if (viewMode === 'play-personalized' && selectedPersonalizedGame) {
    return (
      <PolymorphicGamePlayer
        personalizedMoldId={selectedPersonalizedGame}
        childId={childId}
        onComplete={handleGameComplete}
        onBack={handleBackToDashboard}
      />
    )
  }

  // Dashboard view
  return (
    <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎮 Your Gaming World! 🎮
          </h1>
          <p className="text-lg text-gray-600">
            Play your personalized games or create new ones!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl font-bold text-gray-600">Loading your games... 🎲</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Your Personalized Games */}
            <div className="bg-white rounded-lg border-4 border-green-300 shadow-lg p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Gamepad size={28} />
                Your Personalized Games
              </h2>
              
              {personalizedGames.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-gray-600 mb-4">
                    You haven't created any personalized games yet!
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose a game template below to make it your own.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalizedGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-green-50 border-3 border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
                    >
                      <h3 className="font-bold text-green-800 mb-2">{game.title}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        Theme: {game.config?.theme || 'Custom'}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Type: {game.config?.game_type?.replace('_', ' ') || 'Game'}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedPersonalizedGame(game.id)
                            setViewMode('play-personalized')
                          }}
                          className="flex-1 px-4 py-2 bg-green-500 text-white font-bold rounded-lg border-2 border-green-600 hover:bg-green-600 transform hover:scale-105 transition-all"
                        >
                          Play Now! 🎮
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this game?')) {
                              deletePersonalizedGame(game.id)
                            }
                          }}
                          className="px-3 py-2 bg-red-500 text-white font-bold rounded-lg border-2 border-red-600 hover:bg-red-600 transform hover:scale-105 transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Game Templates */}
            <div className="bg-white rounded-lg border-4 border-purple-300 shadow-lg p-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <Sparkles size={28} />
                Make It Mine!
              </h2>
              
              {availableMolds.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔧</div>
                  <p className="text-gray-600">
                    No game templates available yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableMolds.map((mold) => (
                    <div
                      key={mold.id}
                      className="bg-purple-50 border-3 border-purple-200 rounded-lg p-4"
                    >
                      <h3 className="font-bold text-purple-800 mb-2">{mold.name}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        Category: {mold.category || 'Fun Game'}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Type: {mold.experience_type?.replace('_', ' ') || 'Interactive'}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Ages: {mold.age_min || 3}-{mold.age_max || 12}
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedMold(mold)
                          setViewMode('personalize')
                        }}
                        className="w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-lg border-2 border-purple-600 hover:bg-purple-600 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} />
                        Make It Mine!
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fun Stats */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg border-4 border-yellow-300 shadow-lg p-6 inline-block">
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Your Gaming Stats 📊</h3>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{personalizedGames.length}</div>
                <div className="text-sm text-gray-600">Personalized Games</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{availableMolds.length}</div>
                <div className="text-sm text-gray-600">Templates Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
