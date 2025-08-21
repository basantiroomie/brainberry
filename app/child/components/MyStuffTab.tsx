"use client"
import { Crown, Palette, Trophy, Play, Settings } from "lucide-react"
import { useState, useEffect } from "react"

interface GameAssignment {
  id: string
  progress: number
  status: string
  mold: {
    id: string
    name: string
    category: string
    difficulty: string
    primaryObjective: string
    scenes: Array<{
      id: string
      title: string
      narrative: string
    }>
  }
}

export default function MyStuffTab() {
  const [assignments, setAssignments] = useState<GameAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    try {
      const token = localStorage.getItem('brainberry_child_token')
      if (!token) return

      const response = await fetch('/api/child/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Children can no longer remove games - only parents can manage assignments

  function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AWESOME STUFF!</h1>
        <p className="text-lg text-gray-700">Your personalized games and achievements</p>
      </div>

      {/* My Games Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Play className="h-6 w-6 text-chart-2" />
          <span>My Games</span>
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading your games...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-bold mb-2">No Games Yet!</h3>
            <p className="text-gray-600">Ask your parent or therapist to assign some fun games for you!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white border-4 border-black shadow-brutal-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{assignment.mold.name}</h3>
                  <div className="flex space-x-2">
                    <button 
                      className="bg-blue-500 text-white p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
                      title="Game Info"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className={`text-xs px-2 py-1 border-2 border-black font-bold ${getDifficultyColor(assignment.mold.difficulty)}`}>
                    {assignment.mold.difficulty}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {assignment.mold.category}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4 text-sm">
                  {assignment.mold.primaryObjective}
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{assignment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black h-4">
                    <div 
                      className="bg-chart-2 h-full transition-all duration-300"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {assignment.mold.scenes.length} scenes to explore
                </div>
                
                <button className="w-full bg-chart-2 text-white px-4 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
                  PLAY NOW!
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customization Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Creator */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-3 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Avatar Creator</h3>
            <p className="text-gray-600 mb-4">Design your character!</p>
            <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🦸</span>
            </div>
            <button className="bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              CUSTOMIZE
            </button>
          </div>
        </div>

        {/* World Theme */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-4 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">World Theme</h3>
            <p className="text-gray-600 mb-4">Change your world!</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm font-bold">🦕 Dinosaur World</div>
              <div className="text-sm text-gray-500">🚀 Space Station (Locked)</div>
              <div className="text-sm text-gray-500">🏰 Medieval Castle (Locked)</div>
            </div>
            <button className="bg-chart-4 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              SWITCH THEME
            </button>
          </div>
        </div>

        {/* Trophy Room */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-2 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trophy Room</h3>
            <p className="text-gray-600 mb-4">Your amazing rewards!</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-2xl">🏆</div>
              <div className="text-2xl">⭐</div>
              <div className="text-2xl">🎖️</div>
              <div className="text-2xl">🥇</div>
              <div className="text-2xl">💎</div>
              <div className="text-gray-300 text-2xl">🔒</div>
            </div>
            <button className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              VIEW ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
