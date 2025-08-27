"use client"

import { useState, useEffect } from 'react'
import { Gamepad, Sparkles, ArrowLeft, Palette } from 'lucide-react'
import MoldPersonalizationWizard from './MoldPersonalizationWizard'
import PolymorphicGamePlayer from './PolymorphicGamePlayer'
import CanvasColoringGame from '../Games/CanvasColoringGame'
import { imageCache } from '@/lib/image-cache'
import AvatarStatusIndicator from '@/components/AvatarStatusIndicator'
import { useSafeApiCall } from '@/lib/api-error-prevention'

interface PlayTabProps {
  childId: string
  childProfile?: any
}

type ViewMode = 'dashboard' | 'personalize' | 'play-personalized' | 'expression-game' | 'canvas'

export default function PlayTab({ childId, childProfile }: PlayTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedMold, setSelectedMold] = useState<any>(null)
  const [selectedPersonalizedGame, setSelectedPersonalizedGame] = useState<string | null>(null)

  // Use safe API calls with fallback data
  const { 
    data: availableMolds, 
    error: moldsError, 
    isLoading: moldsLoading 
  } = useSafeApiCall<any[]>('/api/child-molds', {}, {
    fallbackData: [{
      id: 'expression_game',
      name: 'Expression Game',
      category: 'emotional',
      experience_type: 'interactive',
      personalizationComponent: 'ExpressionGame'
    }],
    cache: true
  })

  const { 
    data: personalizedGames, 
    error: personalizedError, 
    isLoading: personalizedLoading 
  } = useSafeApiCall<any[]>(
    childId ? `/api/child-personalized-molds?child_id=${childId}` : null, 
    {}, 
    {
      fallbackData: [],
      cache: true
    }
  )

  const loading = moldsLoading || personalizedLoading

  useEffect(() => {
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
  }, [])

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
        
        // The API hooks will automatically refresh the data
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
    
    // The API hooks will automatically refresh when the component re-renders
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
  if (viewMode === 'canvas') {
    return <CanvasColoringGame onBack={handleBackToDashboard} />
  }
  if (viewMode === 'expression-game' && selectedMold) {
    const ExpressionGame = require('../Games/ExpressionGame').default
    return <ExpressionGame onBack={handleBackToDashboard} />
  }
  if (viewMode === 'personalize' && selectedMold) {
    return (
      <MoldPersonalizationWizard
        moldId={selectedMold.id}
        childId={childId}
        onComplete={(personalizedMoldId: string) => {
          handlePersonalizationComplete(personalizedMoldId)
        }}
        onBack={handleBackToDashboard}
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

  // Helper function to get game icon
  function getGameIcon(gameType: string) {
    switch (gameType?.toLowerCase()) {
      case 'matching':
      case 'memory':
        return '🧠'
      case 'sorting':
        return '📦'
      case 'expression':
        return '😊'
      case 'puzzle':
        return '🧩'
      case 'math':
        return '🔢'
      case 'reading':
        return '📚'
      default:
        return '🎮'
    }
  }

  function getMoldIcon(category: string) {
    switch (category?.toLowerCase()) {
      case 'memory':
        return '🧠'
      case 'creativity':
        return '🎨'
      case 'problem solving':
        return '🧩'
      case 'language':
        return '📝'
      case 'math':
        return '🔢'
      case 'emotional':
        return '😊'
      default:
        return '⭐'
    }
  }

  // Dashboard view
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block transform -rotate-2 mb-4">
          <div className="bg-chart-2 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-4xl transform hover:rotate-1 transition-transform">
             GAME WORLD! 
          </div>
        </div>
        {/* Avatar Status Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <AvatarStatusIndicator
            avatarUrl={childProfile?.avatar_url}
            headshotUrl={childProfile?.avatar_headshot_url}
            childName={childProfile?.name || 'Your'}
            size="medium"
            showText={true}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-600">Loading your games... 🎲</p>
        </div>
      ) : (
        <>
          {/* Show error messages if APIs failed */}
          {(moldsError || personalizedError) && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Some games might not be available right now
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Don't worry - you can still play the games that are loaded!
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (
        <>
          {/* Your Personalized Games Section */}
          {personalizedGames && personalizedGames.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">My Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalizedGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white border-4 border-black shadow-brutal-xl p-6"
                  >
                    <div className="text-center">
                      <div className="bg-chart-1 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">{getGameIcon(game.config?.game_type)}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                      <p className="text-gray-600 mb-4">Ready to play!</p>
                      
                      <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl">{getGameIcon(game.config?.game_type)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedPersonalizedGame(game.id)
                            setViewMode('play-personalized')
                          }}
                          className="flex-1 bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                        >
                          PLAY NOW
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this game?')) {
                              deletePersonalizedGame(game.id)
                            }
                          }}
                          className="bg-red-500 text-white px-3 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Games Section - Combined Fun Games and More Games */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">All Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Canvas Coloring Game */}
              <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
                <div className="text-center">
                  <div className="bg-chart-4 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Palette className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Canvas Coloring</h3>
                  <p className="text-gray-600 mb-4">Turn pictures into coloring pages!</p>
                  
                  <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">🎨</span>
                  </div>
                  
                  <button 
                    onClick={() => setViewMode('canvas')}
                    className="w-full bg-chart-4 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                  >
                    PLAY NOW
                  </button>
                </div>
              </div>

              {/* Available Game Templates */}
              {!availableMolds || availableMolds.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-4xl mb-4">🔧</div>
                  <p className="text-gray-600">
                    No more game templates available yet.
                  </p>
                </div>
              ) : (
                availableMolds.map((mold) => (
                  <div
                    key={mold.id}
                    className="bg-white border-4 border-black shadow-brutal-xl p-6"
                  >
                    <div className="text-center">
                      <div className="bg-chart-2 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">{getMoldIcon(mold.category)}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{mold.name}</h3>
                      <p className="text-gray-600 mb-4">Create your own version!</p>
                      
                      <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl">{getMoldIcon(mold.category)}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedMold(mold)
                          setViewMode(mold.personalizationComponent === 'ExpressionGame' ? 'expression-game' : 'personalize')
                        }}
                        className="w-full bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                      >
                        <Sparkles className="inline-block mr-2" size={16} />
                        MAKE IT MINE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Your Gaming Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-chart-1 text-white border-2 border-black shadow-brutal">
                <div className="text-3xl font-bold mb-2">{personalizedGames?.length || 0}</div>
                <div>Personalized Games</div>
              </div>
              <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
                <div className="text-3xl font-bold mb-2">{availableMolds?.length || 0}</div>
                <div>Templates Available</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
