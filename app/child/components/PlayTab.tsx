import React, { useEffect, useState } from "react"
import { Play, Star, Target } from "lucide-react"

interface Assignment {
  id: string
  moldName: string
  assignedAt: string
  completedAt?: string
  mold: {
    id: string
    name: string
    category: string
    primaryObjective: string
    difficulty: string
  }
}

interface ChildStats {
  totalSessions: number
  totalStars: number
  unlockedLevels: number
  completedAssignments: number
}

export default function PlayTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<ChildStats>({ totalSessions: 0, totalStars: 0, unlockedLevels: 0, completedAssignments: 0 })
  const [childProfile, setChildProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('childProfile')
    if (stored) {
      const profile = JSON.parse(stored)
      setChildProfile(profile)
      loadChildData(profile.id)
    }
  }, [])

  const loadChildData = async (childId: string) => {
    try {
      // Load assignments using child-specific endpoint
      const assignmentsRes = await fetch(`/api/child-assignments?childId=${childId}`)
      let assignmentsData: Assignment[] = []
      if (assignmentsRes.ok) {
        assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      } else {
        console.error('Failed to load assignments:', assignmentsRes.status)
      }

      // Load child analytics for stats using child-specific endpoint
      const analyticsRes = await fetch(`/api/child-analytics?childId=${childId}&days=30`)
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setStats({
          totalSessions: analyticsData.totalSessions || 0,
          totalStars: analyticsData.totalSessions * 2 || 0, // Rough calculation
          unlockedLevels: Math.floor((analyticsData.totalSessions || 0) / 2),
          completedAssignments: assignmentsData.filter((a: Assignment) => a.completedAt).length
        })
      } else {
        console.error('Failed to load analytics:', analyticsRes.status)
        // Set default stats if analytics fail
        setStats({
          totalSessions: 0,
          totalStars: 0,
          unlockedLevels: 0,
          completedAssignments: assignmentsData.filter((a: Assignment) => a.completedAt).length
        })
      }
    } catch (error) {
      console.error('Failed to load child data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startGame = (moldId: string) => {
    // Navigate to the game player
    window.location.href = `/molds/${moldId}`
  }

  const todaysQuest = assignments.find(a => !a.completedAt) || assignments[0]

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-8 inline-block">
            <div className="text-2xl font-bold text-gray-500">Loading your quests...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Today's Quest - Large Featured */}
      <div className="text-center">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-2 mb-4">
            {todaysQuest ? "TODAY'S QUEST!" : "NO QUESTS YET!"}
          </h1>
          {todaysQuest ? (
            <>
              <div className="bg-chart-2 text-white p-6 border-2 border-black shadow-brutal mb-6">
                <h2 className="text-2xl font-bold mb-2">{todaysQuest.mold.name}</h2>
                <p className="text-lg">{todaysQuest.mold.primaryObjective}</p>
                <div className="mt-2 flex justify-center items-center space-x-4 text-sm">
                  <span className="bg-white text-chart-2 px-2 py-1 border border-white rounded">
                    {todaysQuest.mold.category}
                  </span>
                  <span className="bg-white text-chart-2 px-2 py-1 border border-white rounded">
                    {todaysQuest.mold.difficulty}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => startGame(todaysQuest.mold.id)}
                className="bg-chart-2 text-white px-12 py-6 border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-3xl transform hover:scale-105 inline-flex items-center space-x-3"
              >
                <Play className="h-8 w-8" />
                <span>PLAY NOW!</span>
              </button>
            </>
          ) : (
            <div className="bg-gray-200 text-gray-600 p-6 border-2 border-black shadow-brutal">
              <p className="text-lg">Ask your teacher to assign you some games!</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Amazing Progress!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center">
              <Target className="h-8 w-8 mr-2" />
              {stats.completedAssignments}
            </div>
            <div>Quests Completed</div>
          </div>
          <div className="text-center p-4 bg-chart-3 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center">
              <Star className="h-8 w-8 mr-2" />
              {stats.totalStars}
            </div>
            <div>Stars Earned</div>
          </div>
          <div className="text-center p-4 bg-chart-4 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2">{stats.unlockedLevels}</div>
            <div>New Levels</div>
          </div>
        </div>
      </div>

      {/* All Assignments */}
      {assignments.length > 0 && (
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">All Your Quests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className={`p-4 border-2 border-black shadow-brutal ${assignment.completedAt ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <h3 className="font-bold text-lg mb-2">{assignment.mold.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{assignment.mold.primaryObjective}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 border border-black ${assignment.completedAt ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {assignment.completedAt ? 'COMPLETED' : 'PENDING'}
                  </span>
                  {!assignment.completedAt && (
                    <button
                      onClick={() => startGame(assignment.mold.id)}
                      className="bg-chart-2 text-white px-3 py-1 border border-black shadow-brutal text-xs font-bold hover:shadow-brutal-lg"
                    >
                      PLAY
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
