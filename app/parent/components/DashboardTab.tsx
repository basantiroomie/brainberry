"use client"
import { Users, AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { useMemo, useEffect, useState } from 'react'

interface Child {
  id: string
  name: string
  age: number
  diagnosis: string
}

interface Assignment {
  id: string
  childId: string
  moldId: string
  progress: number
  status: string
}

interface Session {
  id: string
  childId: string
  moldId: string
  startedAt: string
  completionPercent: number
  durationSec: number
}

export default function DashboardTab() {
  const [children, setChildren] = useState<Child[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      // For now, we'll use mock data since our API endpoints aren't fully implemented
      // In production, these would be real API calls
      setChildren([
        { id: '1', name: 'Alice', age: 8, diagnosis: 'ADHD' },
        { id: '2', name: 'Bobby', age: 7, diagnosis: 'ASD' }
      ])
      
      setAssignments([
        { id: '1', childId: '1', moldId: 'm1', progress: 75, status: 'in-progress' },
        { id: '2', childId: '2', moldId: 'm2', progress: 60, status: 'in-progress' }
      ])
      
      setSessions([
        {
          id: 's1',
          childId: '1', 
          moldId: 'm1',
          startedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          completionPercent: 85,
          durationSec: 1200
        },
        {
          id: 's2',
          childId: '2',
          moldId: 'm2', 
          startedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          completionPercent: 70,
          durationSec: 900
        }
      ])
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeChildren = children.length
  const gamesThisWeek = sessions.filter(s => 
    Date.now() - new Date(s.startedAt).getTime() < 7 * 86400000
  ).length
  
  const avgProgress = assignments.length > 0 
    ? Math.round(assignments.reduce((sum, assignment) => sum + assignment.progress, 0) / assignments.length)
    : 0
    
  const alertsPending = Math.max(1, Math.round(activeChildren / 3))

  const recentActivity = useMemo(() => {
    return sessions
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 4)
      .map(session => {
        const child = children.find(c => c.id === session.childId)
        return {
          id: session.id,
          title: `${child?.name || 'Unknown'} completed a session`,
          detail: `Score: ${session.completionPercent}% • ${(session.durationSec / 60).toFixed(1)} min`,
          ts: session.startedAt
        }
      })
  }, [sessions, children])

  // Pending assignments (in-progress or assigned, progress < 100)
  const pendingAssignments = useMemo(() => {
    return assignments
      .filter(assignment => assignment.status !== 'completed' && assignment.progress < 100)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 5)
      .map(assignment => {
        const child = children.find(c => c.id === assignment.childId)
        const created = new Date()
        const ageDays = Math.floor((Date.now() - created.getTime()) / 86400000)
        return {
          id: assignment.id,
          childName: child?.name || 'Unknown Child',
          moldName: 'Game Mold', // Would come from mold data
          progress: assignment.progress,
          status: assignment.status,
          ageDays
        }
      })
  }, [assignments, children])

  // Performance alerts
  const performanceAlerts = useMemo(() => {
    const alerts: { id: string; type: string; title: string; body: string; color: string }[] = []
    const last7 = Date.now() - 7 * 86400000
    
    // Check for low activity
    children.forEach(child => {
      const childSessions = sessions.filter(s => 
        s.childId === child.id && new Date(s.startedAt).getTime() >= last7
      )
      if (childSessions.length < 2 && assignments.some(a => a.childId === child.id && a.status !== 'completed')) {
        alerts.push({
          id: 'low-' + child.id,
          type: 'lowActivity',
          title: `Low Activity: ${child.name}`,
          body: `Only ${childSessions.length} session(s) in last 7 days. Consider encouraging a session.`,
          color: 'red'
        })
      }
    })

    // Check for nearly complete assignments
    assignments.filter(a => a.progress >= 90 && a.status !== 'completed').slice(0, 3).forEach(assignment => {
      alerts.push({
        id: 'ready-' + assignment.id,
        type: 'ready',
        title: 'Nearly Complete',
        body: `Assignment at ${assignment.progress}% — consider a finishing push.`,
        color: 'orange'
      })
    })

    // Check for high performance
    children.forEach(child => {
      const childSessions = sessions.filter(s => s.childId === child.id)
      if (childSessions.length >= 3) {
        const avg = Math.round(
          childSessions.reduce((acc, s) => acc + s.completionPercent, 0) / childSessions.length
        )
        if (avg >= 85) {
          alerts.push({
            id: 'high-' + child.id,
            type: 'high',
            title: `High Performance: ${child.name}`,
            body: `Average completion ${avg}% across ${childSessions.length} sessions. Consider increasing difficulty.`,
            color: 'green'
          })
        }
      }
    })

    return alerts.slice(0, 6)
  }, [sessions, assignments, children])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading Dashboard...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-chart-1 mb-4">
            <span>DASHBOARD</span>
          </h1>
          <p className="text-lg text-gray-700">
            Your complete overview at a glance
          </p>
        </div>
      </div>

      {/* Key Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-chart-2 mr-3" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 && (
              <div className="text-xs font-bold text-gray-500">No recent sessions</div>
            )}
            {recentActivity.map((activity, i) => (
              <div key={activity.id} className={`border-l-4 pl-4 py-2 border-chart-${(i % 4) + 1}`}>
                <h3 className="font-bold">{activity.title}</h3>
                <p className="text-gray-600 text-sm">{activity.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-chart-3 mr-3" />
            <h2 className="text-2xl font-bold">Pending Assignments</h2>
          </div>
          <div className="space-y-3">
            {pendingAssignments.length === 0 && (
              <div className="text-xs font-bold text-gray-500">None pending</div>
            )}
            {pendingAssignments.map(assignment => (
              <div key={assignment.id} className="border-2 border-black p-3 bg-secondary shadow-brutal flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{assignment.childName} – {assignment.moldName}</h3>
                  <p className="text-[10px] text-gray-600 font-bold">{assignment.status.toUpperCase()} • {assignment.progress}% • {assignment.ageDays}d old</p>
                  <div className="bg-gray-200 rounded-full h-2 w-40 mt-1 overflow-hidden">
                    <div className="bg-chart-3 h-2" style={{ width: assignment.progress + '%' }}></div>
                  </div>
                </div>
                <a href="/parent?tab=children" className="text-[10px] font-bold underline">MANAGE</a>
              </div>
            ))}
          </div>
          <button 
            onClick={() => window.location.href = '/parent?tab=children'} 
            className="mt-4 bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full"
          >
            CREATE / ASSIGN
          </button>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <h2 className="text-2xl font-bold">Performance Alerts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceAlerts.length === 0 && (
            <div className="text-xs font-bold text-gray-500 col-span-full">No alerts right now</div>
          )}
          {performanceAlerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded border-2 border-black shadow-brutal bg-${alert.color}-50`}> 
              <h3 className={`font-bold mb-2 text-${alert.color}-800 text-sm`}>{alert.title}</h3>
              <p className={`text-${alert.color}-700 text-[11px] font-bold mb-3 leading-snug`}>{alert.body}</p>
              <button className={`px-3 py-1 text-[10px] font-bold border-2 border-black bg-${alert.color}-500 text-white`}>DETAILS</button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-chart-1 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{activeChildren}</div>
            <div>Active Children</div>
          </div>
          <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{gamesThisWeek}</div>
            <div>Games This Week</div>
          </div>
          <div className="text-center p-4 bg-chart-3 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{avgProgress}%</div>
            <div>Average Progress</div>
          </div>
          <div className="text-center p-4 bg-chart-4 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">{alertsPending}</div>
            <div>Alerts Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}
