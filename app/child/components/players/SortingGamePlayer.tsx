"use client"

import { useState, useEffect } from 'react'
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface SortingGamePlayerProps {
  gameConfig: any
  childId: string
  onComplete?: () => void
  onBack?: () => void
}

interface Item {
  id: string
  image_url: string
  label: string
  category_id: number
  placed: boolean
}

interface Category {
  id: number
  name: string
  color: string
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

  useEffect(() => {
    if (gameConfig?.categories) {
      initializeSortingGame()
    }
  }, [gameConfig])

  function initializeSortingGame() {
    // Set up categories
    const gameCategories: Category[] = gameConfig.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || '#3b82f6',
      items: []
    }))

    // Collect all items and shuffle them
    const allItems: Item[] = []
    gameConfig.categories.forEach((cat: any) => {
      cat.items.forEach((item: any) => {
        allItems.push({
          ...item,
          category_id: cat.id,
          placed: false
        })
      })
    })

    const shuffledItems = [...allItems].sort(() => Math.random() - 0.5)
    
    setCategories(gameCategories)
    setUnplacedItems(shuffledItems)
    setScore(0)
    setGameComplete(false)
    setGameStarted(false)
  }

  function handleDragStart(item: Item) {
    setDraggedItem(item)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, categoryId: number) {
    e.preventDefault()
    
    if (!draggedItem) return
    if (!gameStarted) setGameStarted(true)

    const isCorrectCategory = draggedItem.category_id === categoryId

    if (isCorrectCategory) {
      // Correct placement
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: [...cat.items, { ...draggedItem, placed: true }] }
          : cat
      ))
      setUnplacedItems(prev => prev.filter(item => item.id !== draggedItem.id))
      setScore(prev => prev + 10)

      // Check if game is complete
      if (unplacedItems.length === 1) { // -1 because we just removed one
        setGameComplete(true)
        onComplete?.()
      }
    } else {
      // Wrong placement - show feedback but don't place
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
          Sort Your {theme}! 🗂️
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
            Drag and drop items into the right categories! 📦
          </p>
          <p className="text-sm text-gray-600">
            Match each {theme} item with its correct group
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
                  <div className="text-2xl mb-1">
                    {theme === 'animals' ? '🐾' : 
                     theme === 'food' ? '🍎' :
                     theme === 'toys' ? '🧸' : '⭐'}
                  </div>
                  <div className="text-xs font-bold text-gray-800">{item.label}</div>
                </div>
              ))}
            </div>
            
            {category.items.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Drop {theme} items here
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
                onDragStart={() => handleDragStart(item)}
                onClick={() => handleItemClick(item)}
                className="bg-yellow-100 border-4 border-yellow-300 rounded-lg p-3 text-center cursor-grab active:cursor-grabbing hover:bg-yellow-200 transform hover:scale-105 transition-all"
              >
                <div className="text-2xl mb-1">
                  {theme === 'animals' ? '🐾' : 
                   theme === 'food' ? '🍎' :
                   theme === 'toys' ? '🧸' : '⭐'}
                </div>
                <div className="text-xs font-bold text-gray-800">{item.label}</div>
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
            {gameConfig?.success_message || `You sorted all the ${theme} perfectly!`}
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
