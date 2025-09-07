"use client"

import { useState, useEffect } from 'react'
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useImagePreloader, SmartImage } from '@/components/ImagePreloader'
import GameLoadingScreen from '@/components/GameLoadingScreen'
import { imageCache } from '@/lib/image-cache'

interface SortingGamePlayerProps {
  gameConfig: any
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

interface Item {
  id: string
  name?: string
  label?: string
  image_url: string
  category_id: number
  description?: string
  placed: boolean
  ai_generation?: {
    fallback_emoji?: string
    gemini_generated?: boolean
  }
}

interface Category {
  id: number
  name: string
  color: string
  description?: string
  items: Item[]
}

export default function SortingGamePlayer({ gameConfig, childId, onComplete, onBack }: SortingGamePlayerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [unplacedItems, setUnplacedItems] = useState<Item[]>([])
  const [draggedItem, setDraggedItem] = useState<Item | null>(null)
  const [score, setScore] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Extract image URLs for preloading
  const imageUrls = gameConfig?.categories?.flatMap((cat: any) => 
    cat.items?.map((item: any) => item.image_url) || []
  ) || []
  
  const fallbackEmojis = gameConfig?.categories?.flatMap((cat: any) => 
    cat.items?.map((item: any) => item.ai_generation?.fallback_emoji || '⭐') || []
  ) || []

  // Preload images with enhanced caching
  const { allLoaded, getCachedUrl } = useImagePreloader({
    images: imageUrls,
    onAllLoaded: () => setImagesReady(true),
    onProgress: (loaded, total) => setLoadingProgress(loaded),
    fallbackEmojis
  })

  // Sound effects
  const playSound = (type: 'correct' | 'wrong' | 'complete') => {
    if (!soundEnabled) return
    
    // Create audio context for simple beeps
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Different frequencies for different sounds
    switch (type) {
      case 'correct':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // High pitch
        break
      case 'wrong':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime) // Low pitch
        break
      case 'complete':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime) // Very high pitch
        break
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  useEffect(() => {
    if (gameConfig?.categories && imagesReady) {
      initializeSortingGame()
    }
  }, [gameConfig, imagesReady])

  // Safety: if some images fail and imagesReady never becomes true, fallback after 1.5s
  useEffect(() => {
    if (!gameConfig?.categories) return
    if (imagesReady) return
    const timer = setTimeout(() => {
      if (!imagesReady) {
        console.warn('[SortingGame] Forcing imagesReady after timeout to avoid blocking UI')
        setImagesReady(true)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [gameConfig?.categories, imagesReady])

  function initializeSortingGame() {
    // Enforce maximum of 3 categories
    const limitedCategoriesSrc = gameConfig.categories.slice(0, 3)

    // Normalize categories
    const gameCategories: Category[] = limitedCategoriesSrc.map((cat: any, idx: number) => ({
      id: cat.id ?? (idx + 1),
      name: cat.name || `Category ${idx + 1}`,
      color: cat.color || ['#6366f1', '#ec4899', '#10b981'][idx % 3],
      items: []
    }))

    // Collect and limit items to 4 per category (total 12)
    const allItems: Item[] = []
    limitedCategoriesSrc.forEach((cat: any, idx: number) => {
      const catItems = (cat.items || []).slice(0, 4) // limit 4 each
      catItems.forEach((item: any, itemIdx: number) => {
        allItems.push({
          ...item,
          id: item.id || `${cat.id || idx + 1}-${itemIdx + 1}`,
          category_id: cat.id ?? (idx + 1),
          placed: false
        })
      })
    })

    // If fewer than 12 items provided, just shuffle what we have
    const shuffledItems = [...allItems].sort(() => Math.random() - 0.5)

    setCategories(gameCategories)
    setUnplacedItems(shuffledItems)
    setScore(0)
    setGameComplete(false)
    setGameStarted(false)


    // Eagerly preload unplaced item images (some may not have loaded in global preloader)
    const urls = shuffledItems.map(i => i.image_url).filter(Boolean)
    imageCache.preloadImages(urls, 6).then(() => {
      setUnplacedItems(prev => [...prev])
    }).catch(() => {})
  }

  function handleDragStart(e: React.DragEvent, item: Item) {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem(item)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, categoryId: number) {
    e.preventDefault()
    
    const itemId = e.dataTransfer.getData('text/plain')
    const item = draggedItem || unplacedItems.find(i => i.id === itemId)
    
    if (!item) return
    if (!gameStarted) setGameStarted(true)

    const isCorrectCategory = item.category_id === categoryId

    if (isCorrectCategory) {
      // Correct placement
      playSound('correct')
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: [...cat.items, { ...item, placed: true }] }
          : cat
      ))
      setUnplacedItems(prev => prev.filter(unplacedItem => unplacedItem.id !== item.id))
      setScore(prev => prev + 10)

      // Check if game is complete
      if (unplacedItems.length === 1) { // -1 because we just removed one
        playSound('complete')
        setGameComplete(true)
        onComplete?.()
      }
    } else {
      // Wrong placement - show feedback but don't place
      playSound('wrong')
      // TODO: Add visual feedback for wrong placement
    }

    setDraggedItem(null)
  }

  function handleItemClick(item: Item) {
    // Mobile-friendly interaction
    if (!gameStarted) setGameStarted(true)
    // TODO: Implement mobile selection mode
  }

  function resetGame() {
    initializeSortingGame()
  }

  const theme = gameConfig?.theme || 'default'

  // Show loading screen while images are loading
  if (!imagesReady) {
    return (
      <GameLoadingScreen 
        progress={loadingProgress}
        total={imageUrls.length}
        gameTitle="Sorting Game"
        theme={theme}
      />
    )
  }

  return (
    <div className="min-h-screen bg-purple-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-bold rounded-lg border-4 border-gray-700 shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-center text-purple-800">
          {gameConfig?.theme || 'Sort Your Items!'} 🗂️
        </h1>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 bg-white rounded-lg border-4 border-gray-300 shadow-lg hover:scale-105 transition-all"
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Score */}
      <div className="text-center mb-6">
        <div className="bg-white p-3 rounded-lg border-4 border-gray-300 shadow-lg inline-block">
          <div className="text-lg font-bold text-gray-800">⭐ {score} points</div>
        </div>
      </div>

      {/* Game Instructions */}
      {!gameStarted && (
        <div className="text-center mb-6 p-4 bg-white rounded-lg border-4 border-purple-300 shadow-lg max-w-md mx-auto">
          <p className="text-lg font-bold text-purple-800 mb-2">
            {gameConfig?.instructions || 'Drag and drop items into the right categories! 📦'}
          </p>
          <p className="text-sm text-gray-600">
            {gameConfig?.theme ? `Enjoy your ${gameConfig.theme}!` : 'Match each item with its correct group'}
          </p>
        </div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {categories.map(category => (
          <div
            key={category.id}
            className="bg-white rounded-lg border-4 border-gray-300 shadow-lg p-4 min-h-[200px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category.id)}
          >
            <h3 
              className="text-lg font-bold text-center mb-4 p-2 rounded-lg text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {category.items.map(item => (
                <div
                  key={item.id}
                  className="bg-green-100 border-2 border-green-500 rounded-lg p-2 text-center"
                >
                  <div className="mb-1">
                    <div className="w-12 h-12 mx-auto rounded">
                      <SmartImage
                        src={getCachedUrl ? getCachedUrl(item.image_url) : item.image_url}
                        alt={item.name || item.label || 'Game item'}
                        className="w-full h-full rounded"
                        fallbackEmoji={item.ai_generation?.fallback_emoji || '⭐'}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-800">{item.name || item.label}</div>
                </div>
              ))}
            </div>
            
            {category.items.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {category.description || `Drop items here`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Items to Sort */}
      {unplacedItems.length > 0 && (
        <div className="bg-white rounded-lg border-4 border-gray-300 shadow-lg p-4">
          <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
            Items to Sort ({unplacedItems.length} left)
          </h3>
          
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {unplacedItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleItemClick(item)}
                className="bg-yellow-100 border-4 border-yellow-300 rounded-lg p-3 text-center cursor-grab active:cursor-grabbing hover:bg-yellow-200 transform hover:scale-105 transition-all"
              >
                <div className="mb-1">
                  <div className="w-12 h-12 mx-auto rounded overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={getCachedUrl ? getCachedUrl(item.image_url) : item.image_url}
                      alt={item.name || item.label || 'Game item'}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-xl'>${item.ai_generation?.fallback_emoji || '⭐'}</div>`
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-800">{item.name || item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Complete */}
      {gameComplete && (
        <div className="text-center mt-8 p-6 bg-white rounded-lg border-4 border-green-500 shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            🎉 Perfect Sorting! 🎉
          </h2>
          <p className="text-lg text-gray-800 mb-4">
            {gameConfig?.ui_customization?.success_message || `You sorted all the items perfectly!`}
          </p>
          <div className="text-sm text-gray-600 mb-4">
            Final Score: {score} points
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-lg border-4 border-blue-700 shadow-lg hover:bg-blue-600 transform hover:scale-105 transition-all"
            >
              <RotateCcw size={20} />
              Sort Again
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
  )
}
