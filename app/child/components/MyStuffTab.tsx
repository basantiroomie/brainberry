import { Crown, Trophy, MessageCircle, Star, Award, Medal, Shield, Gem, ArrowLeft, Palette, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import ChatAssistant from "./ChatAssistant"
import { SimpleAvatarViewer } from "@/components/SimpleAvatarViewer"
import AvatarChatCoordinator from "@/components/AvatarChatCoordinator"
import ChildAvatarCreator from "./ChildAvatarCreator"
import { toast } from 'sonner'
import { avatarRefreshManager } from '@/lib/avatar-refresh-manager'

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
    achievements: ['first-quest', 'quest-master'] 
  })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'chat' | 'themes' | 'trophies'>('overview')
  const [showTrophyPopup, setShowTrophyPopup] = useState(false)
  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [refreshProfile, setRefreshProfile] = useState(0)

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

      const achievements = ['first-quest', 'quest-master'] // Start with 2 default achievements
      if (completedCount >= 3) achievements.push('dedicated-player')
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

  const getAchievementDescription = (achievement: string) => {
    switch (achievement) {
      case 'first-quest': return 'Completed your very first learning quest!'
      case 'quest-master': return 'Mastered 3 different learning quests!'
      case 'dedicated-player': return 'Played for 5 amazing sessions!'
      case 'superstar': return 'Completed 5 quests like a true superstar!'
      case 'champion': return 'Reached 10 play sessions - you\'re a champion!'
      default: return 'Amazing achievement unlocked!'
    }
  }

  const getTrophyColor = (achievement: string) => {
    switch (achievement) {
      case 'first-quest': return 'bg-green-400'
      case 'quest-master': return 'bg-blue-400'
      case 'dedicated-player': return 'bg-purple-400'
      case 'superstar': return 'bg-yellow-400'
      case 'champion': return 'bg-pink-400'
      default: return 'bg-gray-400'
    }
  }

  const allTrophies = [
    'first-quest',
    'quest-master', 
    'dedicated-player',
    'superstar',
    'champion'
  ]

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

  // Handle avatar creation success
  const handleAvatarSaved = async () => {
    try {
      // Get updated profile from sessionStorage (updated by the avatar creator)
      const updatedProfileData = sessionStorage.getItem('childProfile')
      if (updatedProfileData) {
        const updatedProfile = JSON.parse(updatedProfileData)
        
        console.log('Avatar saved and profile updated:', {
          childId: updatedProfile.id,
          avatarUrl: updatedProfile.avatar_url,
          headshotUrl: updatedProfile.avatar_headshot_url
        })
        
        // Trigger a refresh of the child profile state
        setRefreshProfile(prev => prev + 1)
        
        // Use the avatar refresh manager to handle cache clearing and notifications
        await avatarRefreshManager.notifyAvatarUpdated({
          childId: updatedProfile.id,
          oldAvatarUrl: childProfile?.avatar_url,
          newAvatarUrl: updatedProfile.avatar_url,
          oldHeadshotUrl: childProfile?.avatar_headshot_url,
          newHeadshotUrl: updatedProfile.avatar_headshot_url,
          timestamp: new Date()
        })
        
        toast.success('🎉 Your avatar has been saved and updated everywhere!')
      } else {
        // Fallback: reload page
        toast.success('🎉 Your avatar has been saved! Refreshing page...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Error refreshing profile after avatar save:', error)
      toast.success('🎉 Your avatar has been saved! Refreshing page...')
      
      // Fallback: reload page after a delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  // Show avatar view section with creation capability
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
            <h2 className="text-2xl font-bold mb-2">
              {childProfile?.avatar_url ? 'Your Amazing Avatar!' : 'Create Your Avatar!'}
            </h2>
            <p className="text-gray-600">
              {childProfile?.avatar_url 
                ? 'This is your special 3D character that represents you!' 
                : 'Design your own unique 3D character to use in games and chats!'
              }
            </p>
          </div>
          
          {childProfile?.avatar_url ? (
            <div className="space-y-6">
              <div className="bg-gray-100 border-2 border-black rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <SimpleAvatarViewer
                  avatarUrl={childProfile.avatar_url}
                  enableControls={true}
                  cameraMode="full"
                  className="w-full h-full"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowAvatarCreator(true)}
                  className="bg-chart-1 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2"
                >
                  <Palette className="h-5 w-5" />
                  <span>CREATE NEW AVATAR</span>
                </button>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded text-center">
                <p className="text-sm text-blue-700">
                  💡 You can create a new avatar anytime! Your old avatar will be replaced with the new one.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-black rounded-lg p-12 text-center">
                <div className="text-8xl mb-6">🎨</div>
                <h3 className="text-2xl font-bold mb-4">Ready to Create Your Avatar?</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Let's make an amazing 3D character that looks just like you!
                </p>
                
                <button
                  onClick={() => setShowAvatarCreator(true)}
                  className="bg-chart-3 text-white px-8 py-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-xl flex items-center space-x-3 mx-auto transform hover:scale-105 transition-all"
                >
                  <Plus className="h-6 w-6" />
                  <span>CREATE MY AVATAR!</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-green-300 p-4 rounded text-center">
                  <div className="text-3xl mb-2">📸</div>
                  <h4 className="font-bold text-green-800 mb-1">Take a Photo</h4>
                  <p className="text-sm text-green-700">Use your camera or upload a picture</p>
                </div>
                <div className="bg-white border-2 border-blue-300 p-4 rounded text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h4 className="font-bold text-blue-800 mb-1">Customize</h4>
                  <p className="text-sm text-blue-700">Make it look exactly how you want</p>
                </div>
                <div className="bg-white border-2 border-purple-300 p-4 rounded text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <h4 className="font-bold text-purple-800 mb-1">Play & Chat</h4>
                  <p className="text-sm text-purple-700">Use your avatar in games and conversations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Creator Modal */}
        <ChildAvatarCreator
          isOpen={showAvatarCreator}
          onClose={() => setShowAvatarCreator(false)}
          childProfile={childProfile}
          onAvatarSaved={handleAvatarSaved}
        />
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
            
            <div className="space-y-2">
              <button 
                onClick={() => setActiveSection('avatar')}
                className="w-full bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
              >
                {childProfile?.avatar_url ? 'VIEW AVATAR' : 'VIEW AVATAR CREATOR'}
              </button>
              
              {!childProfile?.avatar_url && (
                <button
                  onClick={() => setShowAvatarCreator(true)}
                  className="w-full bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>CREATE NOW!</span>
                </button>
              )}
            </div>
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
            
            <button 
              onClick={() => setShowTrophyPopup(true)}
              className="w-full bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
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

      {/* Trophy Popup Modal */}
      {showTrophyPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-brutal-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-yellow-400 text-white p-6 border-b-4 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8" />
                  <h2 className="text-3xl font-bold">MY TROPHY ROOM</h2>
                </div>
                <button 
                  onClick={() => setShowTrophyPopup(false)}
                  className="bg-red-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-xl"
                >
                  X
                </button>
              </div>
              <p className="mt-2 text-yellow-100">
                You've earned {progress.achievements.length} out of {allTrophies.length} amazing trophies!
              </p>
            </div>

            {/* Trophy Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTrophies.map((trophy) => {
                  const isUnlocked = progress.achievements.includes(trophy)
                  return (
                    <div 
                      key={trophy}
                      className={`relative border-4 border-black shadow-brutal-lg overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                        isUnlocked ? 'bg-white' : 'bg-gray-100'
                      }`}
                    >
                      {/* Trophy Background */}
                      <div className={`h-32 border-b-4 border-black relative overflow-hidden ${
                        isUnlocked ? getTrophyColor(trophy) : 'bg-gray-300'
                      }`}>
                        
                        {/* Sparkle Animation for Unlocked Trophies */}
                        {isUnlocked && (
                          <>
                            <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
                            <div className="absolute top-4 right-3 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
                            <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200"></div>
                            <div className="absolute bottom-2 right-2 w-1 h-1 bg-white rounded-full animate-ping delay-300"></div>
                          </>
                        )}
                        
                        {/* Trophy Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`p-4 rounded-full border-4 border-white shadow-lg ${
                            isUnlocked ? 'bg-white' : 'bg-gray-200'
                          }`}>
                            <div className={`text-4xl ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}`}>
                              {getAchievementIcon(trophy)}
                            </div>
                          </div>
                        </div>

                        {/* New Badge for Recently Unlocked */}
                        {isUnlocked && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 border border-black font-bold transform rotate-12">
                            EARNED!
                          </div>
                        )}

                        {/* Lock Icon for Locked Trophies */}
                        {!isUnlocked && (
                          <div className="absolute bottom-2 right-2 bg-gray-600 text-white p-1 rounded border border-black">
                            <Shield className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Trophy Details */}
                      <div className="p-4">
                        <h3 className={`text-lg font-bold mb-2 ${
                          isUnlocked ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {getAchievementName(trophy)}
                        </h3>
                        <p className={`text-sm leading-relaxed ${
                          isUnlocked ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {getAchievementDescription(trophy)}
                        </p>
                        
                        {/* Status Indicator */}
                        <div className="mt-3">
                          {isUnlocked ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-bold">UNLOCKED!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-xs font-bold">KEEP LEARNING!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Encouraging Message */}
              <div className="mt-8 text-center bg-blue-100 border-4 border-black shadow-brutal p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Keep Going, Champion!</h3>
                <p className="text-gray-600">
                  Every quest you complete and every session you play brings you closer to unlocking more amazing trophies!
                </p>
                {progress.achievements.length < allTrophies.length && (
                  <div className="mt-4 bg-white border-2 border-black px-4 py-2 inline-block shadow-brutal">
                    <span className="font-bold text-purple-600">
                      Next Trophy: {getAchievementName(allTrophies.find(t => !progress.achievements.includes(t)) || '')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Creator Modal */}
      <ChildAvatarCreator
        isOpen={showAvatarCreator}
        onClose={() => setShowAvatarCreator(false)}
        childProfile={childProfile}
        onAvatarSaved={handleAvatarSaved}
      />
    </div>
  )
}
