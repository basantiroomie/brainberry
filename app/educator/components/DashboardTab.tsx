"use client"
import { AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { useMockData } from './MockDataContext'
import { useMemo, useEffect, useState } from 'react'

export default function DashboardTab() {
  const { useMock, dataset } = useMockData()
  const [realChildren, setRealChildren] = useState<any[]>([])
  const [randomData, setRandomData] = useState<any>(null)

  // Generate random sessions and assignments based on real children
  const generateRandomDataForChildren = (children: any[]) => {
    if (!children.length) return null

    const mockMolds = [
      { id: 'mold-1', name: 'Memory Garden' },
      { id: 'mold-2', name: 'Focus Forest' },
      { id: 'mold-3', name: 'Attention Adventure' },
      { id: 'mold-4', name: 'Social Skills Safari' },
      { id: 'mold-5', name: 'Emotion Explorer' },
      { id: 'mold-6', name: 'Planning Palace' }
    ]

    const mockAssignments = children.map((child, i) => ({
      id: `assignment-${child.id}-${i}`,
      childId: child.id,
      moldId: mockMolds[i % mockMolds.length].id,
      status: ['assigned', 'in-progress', 'completed'][Math.floor(Math.random() * 3)],
      progress: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
    }))

    const mockSessions = []
    for (let i = 0; i < Math.min(children.length * 3, 20); i++) {
      const child = children[Math.floor(Math.random() * children.length)]
      const mold = mockMolds[Math.floor(Math.random() * mockMolds.length)]
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      mockSessions.push({
        id: `session-${i}`,
        childId: child.id,
        moldId: mold.id,
        completionPercent: Math.floor(Math.random() * 100),
        durationSec: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
        startedAt: startTime.toISOString(),
        endedAt: new Date(startTime.getTime() + 1200000).toISOString()
      })
    }

    return { 
      children, 
      molds: mockMolds, 
      assignments: mockAssignments, 
      sessions: mockSessions 
    }
  }

  useEffect(() => {
    // Always fetch real children from API
    (async () => {
      try {
        const cRes = await fetch('/api/children')
        if (cRes.ok) {
          const childrenData = await cRes.json()
          const children = Array.isArray(childrenData) ? childrenData : (childrenData?.data || [])
          setRealChildren(children)
          
          // Generate random data based on real children
          const generatedData = generateRandomDataForChildren(children)
          setRandomData(generatedData)
        } else {
          // Fallback to mock children if API fails
          const fallbackChildren = [
            { id: 'child-1', name: 'Emma Thompson', age: 8 },
            { id: 'child-2', name: 'Liam Rodriguez', age: 7 },
            { id: 'child-3', name: 'Sophia Chen', age: 9 }
          ]
          setRealChildren(fallbackChildren)
          const generatedData = generateRandomDataForChildren(fallbackChildren)
          setRandomData(generatedData)
        }
      } catch (error) {
        console.error('Error loading children:', error)
        // Fallback to mock children if fetch fails
        const fallbackChildren = [
          { id: 'child-1', name: 'Emma Thompson', age: 8 },
          { id: 'child-2', name: 'Liam Rodriguez', age: 7 },
          { id: 'child-3', name: 'Sophia Chen', age: 9 }
        ]
        setRealChildren(fallbackChildren)
        const generatedData = generateRandomDataForChildren(fallbackChildren)
        setRandomData(generatedData)
      }
    })()
  }, [])

  // Use randomData (real children + random sessions/assignments) by default
  const activeData = randomData || { children: [], sessions: [], assignments: [], molds: [] }
  const activeChildren = activeData.children.length
  const gamesThisWeek = activeData.sessions.filter((s: any) => Date.now() - new Date(s.startedAt).getTime() < 7 * 86400000).length
  const avgProgress = (() => {
    const sourceAssignments = activeData.assignments
    if (!sourceAssignments.length) return 0
    return Math.round(sourceAssignments.reduce((a: any, b: any) => a + (b.progress || 0), 0) / sourceAssignments.length)
  })()
  const alertsPending = Math.max(1, Math.round(activeChildren / 3))

  const recentActivity = useMemo(() => {
    const sessions = (activeData?.sessions || []).slice(0, 40).sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    return sessions.slice(0, 4).map((s: any) => {
      const child = activeData?.children.find((c: any) => c.id === s.childId)
      const mold = activeData?.molds.find((m: any) => m.id === s.moldId)
      return { 
        id: s.id, 
        title: `${child?.name} played "${mold?.name}"`, 
        detail: `Score: ${s.completionPercent}% • ${(s.durationSec / 60).toFixed(1)} min`, 
        ts: s.startedAt 
      }
    })
  }, [activeData])

  // Pending assignments (in-progress or assigned, progress < 100)
  const pendingAssignments = useMemo(() => {
    const source = activeData?.assignments || []
    const moldMap: Record<string, any> = Object.fromEntries((activeData?.molds || []).map((m: any) => [m.id, m]))
    const childMap: Record<string, any> = Object.fromEntries((activeData?.children || []).map((c: any) => [c.id, c]))
    const list = source
      .filter((a: any) => (a.status !== 'completed') && (a.progress ?? 0) < 100)
      .sort((a: any, b: any) => (a.progress ?? 0) - (b.progress ?? 0))
      .slice(0, 5)
      .map((a: any) => {
        const moldName = a.mold?.name || moldMap[a.moldId]?.name || 'Unknown Mold'
        const childName = a.child?.name || childMap[a.childId]?.name || 'Unknown Child'
        const created = new Date(a.createdAt || Date.now())
        const ageDays = Math.floor((Date.now() - created.getTime()) / 86400000)
        return {
          id: a.id,
          childName,
          moldName,
          progress: a.progress || 0,
          status: a.status,
          ageDays
        }
      })
    return list
  }, [activeData])

  // Performance alerts heuristics
  const performanceAlerts = useMemo(() => {
    const alerts: { id: string; type: string; title: string; body: string; color: string }[] = []
    const sessions = activeData?.sessions || []
    const assignments = activeData?.assignments || []
    const children = activeData?.children || []
    const last7 = Date.now() - 7 * 86400000
    
    // Low activity per child
    if (Array.isArray(children)) {
      children.forEach((c: any) => {
        const childSessions = sessions.filter((s: any) => s.childId === c.id && new Date(s.startedAt).getTime() >= last7)
        if (childSessions.length < 2 && assignments.some((a: any) => a.childId === c.id && a.status !== 'completed')) {
          alerts.push({ id: 'low-' + c.id, type: 'lowActivity', title: `Low Activity: ${c.name}`, body: `Only ${childSessions.length} session(s) in last 7 days. Consider encouraging a session.`, color: 'red' })
        }
      })
    }
    
    // Ready to complete assignments
    if (Array.isArray(assignments)) {
      assignments.filter((a: any) => (a.progress || 0) >= 90 && a.status !== 'completed').slice(0, 3).forEach((a: any) => {
        alerts.push({ id: 'ready-' + a.id, type: 'ready', title: 'Nearly Complete', body: `Assignment ${(a.id || '').slice(0, 6)} at ${a.progress}% — consider a finishing push.`, color: 'orange' })
      })
    }
    
    // High performance children (avg completion >=85)
    if (Array.isArray(children)) {
      children.forEach((c: any) => {
        const childSessions = sessions.filter((s: any) => s.childId === c.id)
        if (childSessions.length >= 3) {
          const avg = Math.round(childSessions.reduce((acc: any, s: any) => acc + (s.completionPercent || 0), 0) / childSessions.length)
          if (avg >= 85) alerts.push({ id: 'high-' + c.id, type: 'high', title: `High Performance: ${c.name}`, body: `Average completion ${avg}% across ${childSessions.length} sessions. Consider increasing difficulty.`, color: 'green' })
        }
      })
    }
    
    // Generate some demo alerts if we have children but no alerts
    if (alerts.length === 0 && children.length > 0) {
      const c0 = children[0]
      const c1 = children[1]
      const c2 = children[2]
      if (c0) alerts.push({ id: 'demo-low-' + c0.id, type: 'lowActivity', title: `Low Activity: ${c0.name}`, body: `Only 1 session logged recently. Encourage a focused play.`, color: 'red' })
      if (c1) alerts.push({ id: 'demo-ready-' + c1.id, type: 'ready', title: `Nearly Complete: ${c1.name}`, body: `One assignment at 95% progress—push to finish for a confidence boost.`, color: 'orange' })
      if (c2) alerts.push({ id: 'demo-high-' + c2.id, type: 'high', title: `High Performance: ${c2.name}`, body: `Consistently strong completion. Consider increasing difficulty.`, color: 'green' })
    }
    
    return alerts.slice(0, 6)
  }, [activeData])
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
            {recentActivity.length === 0 && <div className="text-xs font-bold text-gray-500">No recent sessions</div>}
            {recentActivity.map((r: any, i: number) => (
              <div key={r.id} className={`border-l-4 pl-4 py-2 border-chart-${(i % 4) + 1}`}>
                <h3 className="font-bold">{r.title}</h3>
                <p className="text-gray-600 text-sm">{r.detail}</p>
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
            {pendingAssignments.length === 0 && <div className="text-xs font-bold text-gray-500">None pending</div>}
            {pendingAssignments.map((pa: any) => (
              <div key={pa.id} className="border-2 border-black p-3 bg-secondary shadow-brutal flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{pa.childName} – {pa.moldName}</h3>
                  <p className="text-[10px] text-gray-600 font-bold">{pa.status.toUpperCase()} • {pa.progress}% • {pa.ageDays}d old</p>
                  <div className="bg-gray-200 rounded-full h-2 w-40 mt-1 overflow-hidden"><div className="bg-chart-3 h-2" style={{ width: pa.progress + '%' }}></div></div>
                </div>
                <a href="/educator?tab=children" className="text-[10px] font-bold underline">MANAGE</a>
              </div>
            ))}
          </div>
          <button onClick={() => location.href = '/educator?tab=children'} className="mt-4 bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full">
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
          {performanceAlerts.length === 0 && <div className="text-xs font-bold text-gray-500 col-span-full">No alerts right now</div>}
          {performanceAlerts.map(a => (
            <div key={a.id} className={`p-4 rounded border-2 border-black shadow-brutal bg-${a.color}-50`}>
              <h3 className={`font-bold mb-2 text-${a.color}-800 text-sm`}>{a.title}</h3>
              <p className={`text-${a.color}-700 text-[11px] font-bold mb-3 leading-snug`}>{a.body}</p>
              <button className={`px-3 py-1 text-[10px] font-bold border-2 border-black bg-${a.color}-500 text-white`}>DETAILS</button>
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
