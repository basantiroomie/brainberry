import { Crown, Trophy, MessageCircle, Star, Award, Medal, Shield, Gem, ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import ChatAssistant from "./ChatAssistant"
import { SimpleAvatarViewer } from "@/components/SimpleAvatarViewer"
import AvatarChatCoordinator from "@/components/AvatarChatCoordinator"

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

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'dinosaur': return <Star className="h-6 w-6" />
      case 'space': return <Star className="h-6 w-6" />
      case 'castle': return <Crown className="h-6 w-6" />
      default: return <Star className="h-6 w-6" />
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

  const getAchievementIcon = (achievement: string) => {
    switch (achievement) {
      case 'first-quest': return <Trophy className="h-5 w-5" />
      case 'quest-master': return <Star className="h-5 w-5" />
      case 'dedicated-player': return <Medal className="h-5 w-5" />
      case 'superstar': return <Award className="h-5 w-5" />
      case 'champion': return <Gem className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getAchievementName = (achievement: string) => {
    switch (achievement) {
      case 'first-quest': return 'First Quest'
      case 'quest-master': return 'Quest Master'
      case 'dedicated-player': return 'Dedicated Player'
      case 'superstar': return 'Superstar'
      case 'champion': return 'Champion'
      default: return 'Achievement'
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-block transform -rotate-2 mb-4">
            <div className="bg-chart-3 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-4xl transform hover:rotate-1 transition-transform">
              MY STUFF
            </div>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
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
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
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
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </button>
          <div className="inline-block transform -rotate-1">
            <div className="bg-chart-5 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              {childProfile?.avatar_url ? 'CHAT WITH YOUR 3D AVATAR' : 'CHAT ASSISTANT'}
            </div>
          </div>
        </div>
        
        {/* Chat Mode Toggle - Removed since new component handles mode internally */}
        
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden max-w-4xl mx-auto" style={{ height: '700px' }}>
          {childProfile?.avatar_url ? (
            <AvatarChatCoordinator
              avatarUrl={childProfile.avatar_url}
              childId={childProfile.id}
              onBack={() => setActiveSection('overview')}
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
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Avatar Image */}
          <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 border-b-4 border-black">
            {childProfile?.avatar_headshot_url ? (
              <Image
                src={childProfile.avatar_headshot_url}
                alt="My Avatar"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <Image
                src="/landingpage.jpg"
                alt="My Avatar"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            )}
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200">
              <div className="bg-white rounded-full p-4 border-2 border-black">
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            {/* Status Badge */}
            <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
              <span className="text-sm font-bold text-gray-700">
                {childProfile?.avatar_url ? 'Ready' : 'Pending'}
              </span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">My Avatar</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              {childProfile?.avatar_url ? 'View and interact with your amazing 3D character!' : 'Ask your educator to create your special avatar!'}
            </p>
            
            <button 
              onClick={() => setActiveSection('avatar')}
              className="w-full bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              {childProfile?.avatar_url ? 'VIEW AVATAR' : 'NO AVATAR YET'}
            </button>
          </div>
        </div>

        {/* Chat Assistant */}
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Chat Image */}
          <div className="relative h-48 bg-gradient-to-br from-green-100 to-teal-100 border-b-4 border-black">
            <Image
              src="/Avatar_chat.png"
              alt="Chat Assistant"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-200 to-teal-200">
              <div className="bg-white rounded-full p-4 border-2 border-black">
                <MessageCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            {/* Chat Type Badge */}
            <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
              <span className="text-sm font-bold text-gray-700">
                {childProfile?.avatar_url ? '3D Chat' : 'Text Chat'}
              </span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {childProfile?.avatar_url ? 'Avatar Chat' : 'Chat Assistant'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              {childProfile?.avatar_url ? 'Have conversations with your 3D avatar and learn together!' : 'Ask questions and get help with your learning journey!'}
            </p>

            <button 
              onClick={() => setActiveSection('chat')}
              className="w-full bg-chart-5 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              {childProfile?.avatar_url ? 'CHAT WITH AVATAR' : 'START CHATTING'}
            </button>
          </div>
        </div>

        {/* Trophy Room */}
        <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden hover:shadow-brutal-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Trophy Image */}
          <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-100 border-b-4 border-black">
            <Image
              src="/happy-child-achievement.png"
              alt="Trophy Room"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-200">
              <div className="bg-white rounded-full p-4 border-2 border-black">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            {/* Achievement Count Badge */}
            <div className="absolute top-3 right-3 bg-white border-2 border-black px-3 py-1 rounded-full shadow-brutal">
              <span className="text-sm font-bold text-gray-700">
                {progress.achievements.length}/5
              </span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Trophy Room</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              See all the amazing achievements you've earned through your learning journey!
            </p>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {progress.achievements.slice(0, 6).map((achievement, index) => (
                <div key={index} className="bg-gray-100 border border-gray-300 rounded p-2 flex items-center justify-center" title={getAchievementName(achievement)}>
                  <div className="text-yellow-500">
                    {getAchievementIcon(achievement)}
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - progress.achievements.length) }).map((_, index) => (
                <div key={`locked-${index}`} className="bg-gray-50 border border-gray-200 rounded p-2 flex items-center justify-center">
                  <div className="text-gray-300">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              VIEW ALL TROPHIES
            </button>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden">
        <div className="bg-chart-2 text-white p-6 border-b-4 border-black">
          <h2 className="text-2xl font-bold text-center">Your Learning Progress</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-chart-1 text-white border-2 border-black shadow-brutal">
              <div className="bg-white rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center border-2 border-black">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold mb-2">{progress.completedAssignments}</div>
              <div className="font-medium">Quests Completed</div>
            </div>
            <div className="text-center p-6 bg-chart-2 text-white border-2 border-black shadow-brutal">
              <div className="bg-white rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center border-2 border-black">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold mb-2">{progress.totalSessions}</div>
              <div className="font-medium">Play Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
