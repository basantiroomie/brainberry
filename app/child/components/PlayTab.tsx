"use client"

import { useState, useEffect } from 'react'
import { Gamepad, Sparkles, ArrowLeft } from 'lucide-react'
import MoldPersonalizationWizard from './MoldPersonalizationWizard'
import PolymorphicGamePlayer from './PolymorphicGamePlayer'

interface PlayTabProps {
  childId: string
}

type ViewMode = 'dashboard' | 'personalize' | 'play-personalized'

export default function PlayTab({ childId }: PlayTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedMold, setSelectedMold] = useState<any>(null)
  const [selectedPersonalizedGame, setSelectedPersonalizedGame] = useState<string | null>(null)
  const [availableMolds, setAvailableMolds] = useState<any[]>([])
  const [personalizedGames, setPersonalizedGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGameData()
  }, [childId])

  async function loadGameData() {
    try {
      setLoading(true)
      
      // Load available molds and personalized games
      const [moldsResponse, personalizedResponse] = await Promise.all([
        fetch('/api/molds'),
        fetch(`/api/personalized-molds?child_id=${childId}`)
      ])

      const moldsData = await moldsResponse.json()
      const personalizedData = await personalizedResponse.json()

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

  function handlePersonalizationComplete() {
    // Refresh personalized games and return to dashboard
    loadGameData()
    setViewMode('dashboard')
    setSelectedMold(null)
  }

  function handleGameComplete() {
    // Game completed, return to dashboard
    setViewMode('dashboard')
    setSelectedPersonalizedGame(null)
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
          handlePersonalizationComplete()
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
                      className="bg-green-50 border-3 border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPersonalizedGame(game.id)
                        setViewMode('play-personalized')
                      }}
                    >
                      <h3 className="font-bold text-green-800 mb-2">{game.title}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        Theme: {game.config?.theme || 'Custom'}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Type: {game.config?.game_type?.replace('_', ' ') || 'Game'}
                      </div>
                      <button className="w-full px-4 py-2 bg-green-500 text-white font-bold rounded-lg border-2 border-green-600 hover:bg-green-600 transform hover:scale-105 transition-all">
                        Play Now! 🎮
                      </button>
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
