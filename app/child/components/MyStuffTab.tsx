import { Crown, Palette, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import MyAvatarTab from "../Games/MyAvatarTab"
import CanvasColoringGame from "../Games/CanvasColoringGame"

interface ChildProgress {
  completedAssignments: number
  totalSessions: number
  unlockedThemes: string[]
  achievements: string[]
}

export default function MyStuffTab() {
  const [progress, setProgress] = useState<ChildProgress>({ 
    completedAssignments: 0, 
    totalSessions: 0, 
    unlockedThemes: ['dinosaur'], 
    achievements: [] 
  })
  const [childProfile, setChildProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'themes' | 'trophies' | 'canvas'>('overview')

  useEffect(() => {
    const stored = sessionStorage.getItem('childProfile')
    if (stored) {
      const profile = JSON.parse(stored)
      setChildProfile(profile)
      loadChildProgress(profile.id)
    }
  }, [])

  const loadChildProgress = async (childId: string) => {
    try {
      // Load assignments to count completed using child-specific endpoint
      const assignmentsRes = await fetch(`/api/child-assignments?childId=${childId}`)
      let completedCount = 0
      if (assignmentsRes.ok) {
        const assignments = await assignmentsRes.json()
        completedCount = assignments.filter((a: any) => a.completedAt).length
      }

      // Load analytics for total sessions using child-specific endpoint
      const analyticsRes = await fetch(`/api/child-analytics?childId=${childId}&days=30`)
      let totalSessions = 0
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json()
        totalSessions = analytics.totalSessions || 0
      }

      // Calculate unlocked themes and achievements based on progress
      const unlockedThemes = ['dinosaur']
      if (completedCount >= 3) unlockedThemes.push('space')
      if (completedCount >= 6) unlockedThemes.push('castle')

      const achievements = []
      if (completedCount >= 1) achievements.push('first-quest')
      if (completedCount >= 3) achievements.push('quest-master')
      if (totalSessions >= 5) achievements.push('dedicated-player')
      if (completedCount >= 5) achievements.push('superstar')
      if (totalSessions >= 10) achievements.push('champion')

      setProgress({
        completedAssignments: completedCount,
        totalSessions,
        unlockedThemes,
        achievements
      })
    } catch (error) {
      console.error('Failed to load child progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'dinosaur': return '🦕'
      case 'space': return '🚀'
      case 'castle': return '🏰'
      default: return '🌍'
    }
  }

  const getThemeName = (theme: string) => {
    switch (theme) {
      case 'dinosaur': return 'Dinosaur World'
      case 'space': return 'Space Station'
      case 'castle': return 'Medieval Castle'
      default: return 'Unknown Theme'
    }
  }

  const getAchievementEmoji = (achievement: string) => {
    switch (achievement) {
      case 'first-quest': return '🏆'
      case 'quest-master': return '⭐'
      case 'dedicated-player': return '🎖️'
      case 'superstar': return '🥇'
      case 'champion': return '💎'
      default: return '🏅'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AWESOME STUFF!</h1>
          <p className="text-lg text-gray-700">Loading your amazing progress...</p>
        </div>
      </div>
    )
  }

  // Show avatar customization section
  if (activeSection === 'avatar') {
    return (
      <MyAvatarTab 
        childId={childProfile?.id} 
        onBack={() => setActiveSection('overview')}
      />
    )
  }

  // Show canvas coloring game section
  if (activeSection === 'canvas') {
    return (
      <CanvasColoringGame 
        onBack={() => setActiveSection('overview')}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AWESOME STUFF!</h1>
        <p className="text-lg text-gray-700">Make everything just the way you like it!</p>
      </div>

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
            <button 
              onClick={() => setActiveSection('avatar')}
              className="bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              CUSTOMIZE
            </button>
          </div>
        </div>

        {/* Canvas Coloring Game */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-4 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Canvas Coloring</h3>
            <p className="text-gray-600 mb-4">Turn pictures into coloring pages!</p>
            <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <button 
              onClick={() => setActiveSection('canvas')}
              className="bg-chart-4 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              PLAY GAME
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
              {progress.achievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="text-2xl" title={achievement}>
                  {getAchievementEmoji(achievement)}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - progress.achievements.length) }).map((_, index) => (
                <div key={`locked-${index}`} className="text-gray-300 text-2xl">�</div>
              ))}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {progress.achievements.length} of 5 achievements unlocked
            </div>
            <button className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              VIEW ALL
            </button>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Progress Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-chart-1 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{progress.completedAssignments}</div>
            <div>Quests Completed</div>
          </div>
          <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{progress.totalSessions}</div>
            <div>Play Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
