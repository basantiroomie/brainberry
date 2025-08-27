import { Crown, Trophy, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import MyAvatarTab from "../Games/MyAvatarTab"
import ChatAssistant from "./ChatAssistant"
import AvatarChatbot from "./AvatarChatbot"
import Enhanced3DAvatarChatbot from "@/components/Enhanced3DAvatarChatbot"
import { SimpleAvatarViewer } from "@/components/SimpleAvatarViewer"
import ChildAvatarDisplay from "./ChildAvatarDisplay"

interface ChildProgress {
  completedAssignments: number
  totalSessions: number
  unlockedThemes: string[]
  achievements: string[]
}

interface MyStuffTabProps {
  childProfile: any
}

export default function MyStuffTab({ childProfile }: MyStuffTabProps) {
  const [progress, setProgress] = useState<ChildProgress>({ 
    completedAssignments: 0, 
    totalSessions: 0, 
    unlockedThemes: ['dinosaur'], 
    achievements: [] 
  })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'chat' | 'themes' | 'trophies'>('overview')

  useEffect(() => {
    if (childProfile?.id) {
      loadChildProgress(childProfile.id)
    }
  }, [childProfile])

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

  // Show avatar view section (read-only)
  if (activeSection === 'avatar') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setActiveSection('overview')}
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            <span className="inline-block mr-2">←</span>
            BACK
          </button>
          <div className="inline-block transform -rotate-1">
            <div className="bg-chart-3 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              MY AVATAR
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Your Amazing Avatar!</h2>
            <p className="text-gray-600">This is your special character created by your educator!</p>
          </div>
          
          {childProfile?.avatar_url ? (
            <div className="bg-gray-100 border-2 border-black rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <SimpleAvatarViewer
                avatarUrl={childProfile.avatar_url}
                enableControls={true}
                cameraMode="full"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-gray-100 border-2 border-black rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🦸</div>
              <h3 className="text-xl font-bold mb-2">No Avatar Yet!</h3>
              <p className="text-gray-600">Ask your educator to create an avatar for you!</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show chat section
  if (activeSection === 'chat') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setActiveSection('overview')}
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            <span className="inline-block mr-2">←</span>
            BACK
          </button>
          <div className="inline-block transform -rotate-1">
            <div className="bg-chart-5 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              {childProfile?.avatar_url ? 'CHAT WITH YOUR 3D AVATAR!' : 'CHAT ASSISTANT'}
            </div>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden max-w-4xl mx-auto" style={{ height: '700px' }}>
          {childProfile?.avatar_url ? (
            <Enhanced3DAvatarChatbot
              avatarUrl={childProfile.avatar_url}
              childId={childProfile.id}
              accessCode={childProfile.access_code}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 bg-gray-100 p-4 border-b">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Text Chat Mode</p>
                  <p className="text-xs text-gray-500">Ask your educator to create an avatar for 3D chat!</p>
                </div>
              </div>
              <div className="flex-1">
                <ChatAssistant onBack={() => setActiveSection('overview')} />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-block transform -rotate-2 mb-4">
          <div className="bg-chart-3 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-4xl transform hover:rotate-1 transition-transform">
             MY STUFF
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* My Avatar */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-3 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">My Avatar</h3>
            <p className="text-gray-600 mb-4">See your amazing character!</p>
            <div className="mx-auto mb-4">
              <ChildAvatarDisplay
                avatarUrl={childProfile?.avatar_url}
                headshotUrl={childProfile?.avatar_headshot_url}
                childName={childProfile?.name || 'Your'}
                childId={childProfile?.id}
                size="large"
                className="w-24 h-24"
              />
            </div>
            <button 
              onClick={() => setActiveSection('avatar')}
              className="bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              {childProfile?.avatar_url ? 'VIEW AVATAR' : 'NO AVATAR YET'}
            </button>
          </div>
        </div>

        {/* Chat Assistant */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-5 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {childProfile?.avatar_url ? 'Avatar Chat' : 'Chat Assistant'}
            </h3>
            <p className="text-gray-600 mb-4">
              {childProfile?.avatar_url ? 'Talk with your 3D avatar!' : 'Ask me anything!'}
            </p>
            <div className="mx-auto mb-4">
              {childProfile?.avatar_url ? (
                <ChildAvatarDisplay
                  avatarUrl={childProfile.avatar_url}
                  headshotUrl={childProfile.avatar_headshot_url}
                  childName={childProfile.name || 'Your'}
                  childId={childProfile.id}
                  size="large"
                  className="w-24 h-24"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveSection('chat')}
              className="bg-chart-5 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              {childProfile?.avatar_url ? 'CHAT WITH AVATAR' : 'CHAT NOW'}
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
