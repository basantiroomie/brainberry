"use client"

import { useState, useEffect } from 'react'
import { Gamepad, Sparkles, ArrowLeft, Palette, Brain, BookOpen, Puzzle, Calculator, Heart, Star, Grid3X3, Trash2 } from 'lucide-react'
import Image from 'next/image'
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
      const gameToDelete = personalizedGames?.find(g => g.id === gameId)
      
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

  // Helper function to get game image based on type
  function getGameImage(gameType: string) {
    // Debug: Log which image is being selected
    console.log(`Getting image for game type: ${gameType}`)
    
    switch (gameType?.toLowerCase()) {
      case 'matching':
      case 'memory':
      case 'matching_cards':
      case 'memory_cards':
        console.log('→ Using Memory_match_game.png for memory/matching')
        return '/Memory_match_game.png'
      case 'sorting':
      case 'category_sorting':
        console.log('→ Using Category_sorting_challenge.png for sorting')
        return '/Category_sorting_challenge.png'
      case 'expression':
      case 'emotions':
        console.log('→ Using Expression_game.png for expression')
        return '/Expression_game.png'
      case 'puzzle':
      case 'puzzles':
        console.log('→ Using marisa-howenstine-Cq9slNxV8YU-unsplash.jpg for puzzle')
        return '/marisa-howenstine-Cq9slNxV8YU-unsplash.jpg'
      case 'math':
      case 'mathematics':
        console.log('→ Using therapy-gaming-tablet.png for math')
        return '/therapy-gaming-tablet.png'
      case 'reading':
      case 'language':
        console.log('→ Using ashton-bingham-SAHBl2UpXco-unsplash.jpg for reading')
        return '/ashton-bingham-SAHBl2UpXco-unsplash.jpg'
      case 'creativity':
      case 'creative':
        console.log('→ Using happy-child-achievement.png for creativity')
        return '/happy-child-achievement.png'
      default:
        console.log(`→ Using default placeholder.jpg for unknown type: ${gameType}`)
        return '/placeholder.jpg'
    }
  }

  // Helper function to get mold image based on category or mold name
  function getMoldImage(category: string, moldName?: string) {
    // Debug: Log which image is being selected
    console.log(`Getting image for mold category: ${category} name: ${moldName}`)
    
    const categoryLower = category?.toLowerCase() || ''
    const nameLower = moldName?.toLowerCase() || ''

    // If the mold name explicitly references sorting/category, prefer the sorting image
    if (nameLower.includes('sort') || nameLower.includes('category') || nameLower.includes('sorting')) {
      console.log('→ Using Category_sorting_challenge.png because mold name indicates sorting')
      return '/Category_sorting_challenge.png'
    }

    // Handle Memory & Cognition categories
    if (categoryLower.includes('memory') || categoryLower.includes('cognition')) {
      console.log('→ Using Memory_match_game.png for memory/cognition mold')
      return '/Memory_match_game.png'
    }

    // Handle Sorting categories
    if (categoryLower.includes('sorting') || categoryLower.includes('category')) {
      console.log('→ Using Category_sorting_challenge.png for sorting/category mold')
      return '/Category_sorting_challenge.png'
    }

    // Handle Creativity categories
    if (categoryLower.includes('creativity') || categoryLower.includes('creative')) {
      console.log('→ Using diverse-children-educational-games.png for creativity mold')
      return '/diverse-children-educational-games.png'
    }
    
    // Handle Logic & Learning categories
    if (categoryLower.includes('logic') || categoryLower.includes('learning')) {
      console.log('→ Using alan-rodriguez-N17Nkbsc-zY-unsplash.jpg for logic/learning mold')
      return '/alan-rodriguez-N17Nkbsc-zY-unsplash.jpg'
    }
    
    // Handle Language categories
    if (categoryLower.includes('language')) {
      console.log('→ Using ashton-bingham-SAHBl2UpXco-unsplash.jpg for language mold')
      return '/ashton-bingham-SAHBl2UpXco-unsplash.jpg'
    }
    
    // Handle Math categories
    if (categoryLower.includes('math')) {
      console.log('→ Using therapy-gaming-tablet.png for math mold')
      return '/therapy-gaming-tablet.png'
    }
    
    // Handle Emotional & Social categories
    if (categoryLower.includes('emotional') || categoryLower.includes('emotion') || categoryLower.includes('social')) {
      console.log('→ Using Expression_game.png for emotional/social mold')
      return '/Expression_game.png'
    }
    
    // Handle Problem Solving categories
    if (categoryLower.includes('problem') || categoryLower.includes('solving')) {
      console.log('→ Using marisa-howenstine-Cq9slNxV8YU-unsplash.jpg for problem solving mold')
      return '/marisa-howenstine-Cq9slNxV8YU-unsplash.jpg'
    }
    
    // Exact matches for backwards compatibility
    switch (categoryLower) {
      case 'memory':
        console.log('→ Using yuri-li-p0hDztR46cw-unsplash.jpg for memory mold')
        return '/yuri-li-p0hDztR46cw-unsplash.jpg'
      case 'creativity':
        console.log('→ Using diverse-children-educational-games.png for creativity mold')
        return '/diverse-children-educational-games.png'
      case 'problem solving':
        console.log('→ Using marisa-howenstine-Cq9slNxV8YU-unsplash.jpg for problem solving mold')
        return '/marisa-howenstine-Cq9slNxV8YU-unsplash.jpg'
      case 'language':
        console.log('→ Using ashton-bingham-SAHBl2UpXco-unsplash.jpg for language mold')
        return '/ashton-bingham-SAHBl2UpXco-unsplash.jpg'
      case 'math':
        console.log('→ Using therapy-gaming-tablet.png for math mold')
        return '/therapy-gaming-tablet.png'
      case 'emotional':
        console.log('→ Using sigmund-OV44gxH71DU-unsplash.jpg for emotional mold')
        return '/sigmund-OV44gxH71DU-unsplash.jpg'
      default:
        console.log(`→ Using default landingpage.jpg for unknown category: ${category}`)
        return '/landingpage.jpg'
    }
  }

  // Helper function to get fallback gradient colors based on game type
  function getGameGradient(gameType: string) {
    switch (gameType?.toLowerCase()) {
      case 'matching':
      case 'memory':
        return 'from-purple-100 to-indigo-100'
      case 'sorting':
        return 'from-green-100 to-emerald-100'
      case 'expression':
        return 'from-pink-100 to-rose-100'
      case 'puzzle':
        return 'from-orange-100 to-amber-100'
      case 'math':
        return 'from-blue-100 to-cyan-100'
      case 'reading':
        return 'from-teal-100 to-green-100'
      case 'creativity':
        return 'from-pink-100 to-orange-100'
      default:
        return 'from-gray-100 to-slate-100'
    }
  }

  // Helper function to get fallback gradient colors for molds
  function getMoldGradient(category: string) {
    switch (category?.toLowerCase()) {
      case 'memory':
        return 'from-purple-200 to-indigo-200'
      case 'creativity':
        return 'from-pink-200 to-orange-200'
      case 'problem solving':
        return 'from-orange-200 to-amber-200'
      case 'language':
        return 'from-teal-200 to-green-200'
      case 'math':
        return 'from-blue-200 to-cyan-200'
      case 'emotional':
        return 'from-pink-200 to-rose-200'
      default:
        return 'from-blue-200 to-green-200'
    }
  }

  // Helper function to get game icon component
  function getGameIcon(gameType: string) {
    switch (gameType?.toLowerCase()) {
      case 'matching':
      case 'memory':
        return <Brain className="h-6 w-6" />
      case 'sorting':
        return <Grid3X3 className="h-6 w-6" />
      case 'expression':
        return <Heart className="h-6 w-6" />
      case 'puzzle':
        return <Puzzle className="h-6 w-6" />
      case 'math':
        return <Calculator className="h-6 w-6" />
      case 'reading':
        return <BookOpen className="h-6 w-6" />
      default:
        return <Gamepad className="h-6 w-6" />
    }
  }

  function getMoldIcon(category: string) {
    switch (category?.toLowerCase()) {
      case 'memory':
        return <Brain className="h-6 w-6" />
      case 'creativity':
        return <Palette className="h-6 w-6" />
      case 'problem solving':
        return <Puzzle className="h-6 w-6" />
      case 'language':
        return <BookOpen className="h-6 w-6" />
      case 'math':
        return <Calculator className="h-6 w-6" />
      case 'emotional':
        return <Heart className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  // Helper function to get game description
  function getGameDescription(gameType: string) {
    switch (gameType?.toLowerCase()) {
      case 'matching':
      case 'memory':
        return 'Flip and match pairs of cards to sharpen memory and concentration.'
      case 'sorting':
        return 'Quickly sort items into the right categories to test your logic and organization skills.'
      case 'expression':
        return 'Create and recognize facial expressions to boost emotional awareness and fun interaction.'
      case 'puzzle':
        return 'Solve exciting puzzles and brain teasers'
      case 'math':
        return 'Practice math skills with interactive problems'
      case 'reading':
        return 'Improve reading skills through fun activities'
      default:
        return 'Play this exciting educational game'
    }
  }

  function getMoldDescription(category: string, moldName?: string) {
    const categoryLower = category?.toLowerCase() || ''
    const nameLower = moldName?.toLowerCase() || ''

    // Memory / Cognition
    if (categoryLower.includes('memory') || categoryLower.includes('cognition')) {
      return 'Flip and match pairs of cards to sharpen memory and concentration.'
    }

    // Sorting / Category games (also check mold name)
    if (
      categoryLower.includes('sort') ||
      categoryLower.includes('category') ||
      categoryLower.includes('sorting') ||
      nameLower.includes('sort') ||
      nameLower.includes('category') ||
      nameLower.includes('sorting')
    ) {
      return 'Quickly sort items into the right categories to test your logic and organization skills.'
    }

    // Emotional / Social / Expressions
    if (categoryLower.includes('emotion') || categoryLower.includes('emotional') || categoryLower.includes('social') || categoryLower.includes('express')) {
      return 'Create and recognize facial expressions to boost emotional awareness and fun interaction.'
    }

    // Other exact-ish matches
    if (categoryLower.includes('creativity')) {
      return 'Express yourself through creative activities'
    }

    if (categoryLower.includes('problem')) {
      return 'Develop critical thinking with puzzle challenges'
    }

    if (categoryLower.includes('language')) {
      return 'Enhance communication and language skills'
    }

    if (categoryLower.includes('math')) {
      return 'Master numbers through interactive learning'
    }

    return 'Discover new learning adventures'
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
          <p className="text-xl font-bold text-gray-600">Loading your games...</p>
        </div>
      ) : (
        <>
          {/* Show error messages if APIs failed */}
          {(moldsError || personalizedError) && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="bg-yellow-200 rounded-full p-2 mr-3">
                  <span className="text-yellow-600 text-sm font-bold">!</span>
                </div>
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
              <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Custom Games
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalizedGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Game Image */}
                    <div className={`relative h-48 bg-gradient-to-br ${getGameGradient(game.config?.game_type)} border-b-4 border-black`}>
                      <Image
                        src={getGameImage(game.config?.game_type)}
                        alt={game.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error(`Game image failed to load for ${game.config?.game_type}:`, getGameImage(game.config?.game_type));
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                        onLoad={() => {
                          console.log(`Game image loaded successfully for ${game.config?.game_type}:`, getGameImage(game.config?.game_type));
                        }}
                      />
                      <div className={`hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getGameGradient(game.config?.game_type).replace('100', '200')}`}>
                        <div className="bg-white rounded-full p-4 border-2 border-black">
                          {getGameIcon(game.config?.game_type)}
                        </div>
                      </div>
                      {/* Game Type Badge */}
                      <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
                        <span className="text-sm font-bold text-gray-700 capitalize">
                          {game.config?.game_type || 'Game'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Game Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-800">{game.title}</h3>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {getGameDescription(game.config?.game_type)}
                      </p>
                      
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
                          className="bg-red-500 text-white px-3 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
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
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Discover New Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Canvas Coloring Game */}
              <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
                {/* Game Image */}
                <div className="relative h-48 bg-gradient-to-br from-pink-100 to-orange-100 border-b-4 border-black">
                  <Image
                    src="/Coloring_game.png"
                    alt="Canvas Coloring Game"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Canvas coloring image failed to load:', e);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoad={() => {
                      console.log('Canvas coloring image loaded successfully');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-200 to-orange-200">
                    <div className="bg-white rounded-full p-4 border-2 border-black">
                      <Palette className="h-8 w-8 text-pink-500" />
                    </div>
                  </div>
                  {/* Game Type Badge */}
                  <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
                    <span className="text-sm font-bold text-gray-700">Creativity</span>
                  </div>
                </div>
                
                {/* Game Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">Canvas Coloring</h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    Transform any picture into a coloring page and unleash your creativity with digital art tools.
                  </p>
                  
                  <button 
                    onClick={() => setViewMode('canvas')}
                    className="w-full bg-chart-4 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                  >
                    START COLORING
                  </button>
                </div>
              </div>

              {/* Available Game Templates */}
              {!availableMolds || availableMolds.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-gray-100 border-4 border-black rounded-lg p-8 shadow-brutal">
                    <div className="bg-gray-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Star className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">More Games Coming Soon!</h3>
                    <p className="text-gray-600">
                      We're working on exciting new game templates for you to customize and enjoy.
                    </p>
                  </div>
                </div>
              ) : (
                availableMolds.map((mold) => (
                  <div
                    key={mold.id}
                    className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Game Image */}
                    <div className={`relative h-48 bg-gradient-to-br ${getMoldGradient(mold.category)} border-b-4 border-black`}>
                      <Image
                        src={getMoldImage(mold.category, mold.name)}
                        alt={mold.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error(`Mold image failed to load for ${mold.category}:`, getMoldImage(mold.category, mold.name));
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                        onLoad={() => {
                          console.log(`Mold image loaded successfully for ${mold.category}:`, getMoldImage(mold.category, mold.name));
                        }}
                      />
                      <div className={`hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getMoldGradient(mold.category)}`}>
                        <div className="bg-white rounded-full p-4 border-2 border-black">
                          {getMoldIcon(mold.category)}
                        </div>
                      </div>
                      {/* Game Type Badge */}
                      <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
                        <span className="text-sm font-bold text-gray-700 capitalize">
                          {mold.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Game Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-800">{mold.name}</h3>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {getMoldDescription(mold.category, mold.name)}
                      </p>
                      
                      <button
                        onClick={() => {
                          setSelectedMold(mold)
                          setViewMode(mold.personalizationComponent === 'ExpressionGame' ? 'expression-game' : 'personalize')
                        }}
                        className="w-full bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        CUSTOMIZE GAME
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden">
            <div className="bg-chart-2 text-white p-6 border-b-4 border-black">
              <h2 className="text-2xl font-bold text-center">Your Gaming Progress</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-chart-1 text-white border-2 border-black shadow-brutal rounded-lg">
                  <div className="bg-white rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center border-2 border-black">
                    <Gamepad className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{personalizedGames?.length || 0}</div>
                  <div className="font-medium">Custom Games Created</div>
                </div>
                <div className="text-center p-6 bg-chart-2 text-white border-2 border-black shadow-brutal rounded-lg">
                  <div className="bg-white rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center border-2 border-black">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{availableMolds?.length || 0}</div>
                  <div className="font-medium">Game Templates Available</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
