"use client"
import { BarChart3, TrendingUp, Download, RefreshCw, Activity } from "lucide-react"
import { useEffect, useState } from "react"

interface Child { 
  id: string
  name: string 
}

interface AnalyticsSummary {
  totalSessions: number
  avgCompletion: number
  engagementRate: number
  totalDuration: number
  skills?: { skill: string; value: number }[]
}

export default function AnalyticsTab() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week")
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [children, setChildren] = useState<Child[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadChildren() {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const res = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    }
  }

  async function loadSummary() {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const days = selectedTimeframe === 'week' ? 7 : 
                  selectedTimeframe === 'month' ? 30 : 
                  selectedTimeframe === 'quarter' ? 90 : 365

      const params = new URLSearchParams()
      if (selectedChild) params.set('childId', selectedChild)
      params.set('days', String(days))

      const res = await fetch(`/api/analytics/summary?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      } else {
        console.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { loadChildren() }, [])
  useEffect(() => { loadSummary() }, [selectedChild, selectedTimeframe])

  const timeframes = [
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "quarter", name: "This Quarter" },
    { id: "year", name: "This Year" }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-4 mb-4">
            ANALYTICS
          </h1>
          <p className="text-lg text-gray-700">
            Powerful reporting for tracking long-term trends
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block font-bold mb-2 text-sm">Child:</label>
              <select 
                value={selectedChild} 
                onChange={e => setSelectedChild(e.target.value)} 
                className="border-2 border-black p-3 font-bold"
              >
                <option value="">All Children</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-2 text-sm">Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border-2 border-black p-3 font-bold"
              >
                {timeframes.map((timeframe) => (
                  <option key={timeframe.id} value={timeframe.id}>{timeframe.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={loadSummary}
              disabled={loading}
              className="bg-chart-2 border-4 border-black px-6 py-3 font-bold hover:bg-chart-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button className="bg-chart-3 border-4 border-black px-6 py-3 font-bold hover:bg-chart-2 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-chart-1 border-4 border-black shadow-brutal-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Total Sessions</h3>
            <Activity className="w-8 h-8" />
          </div>
          <p className="text-3xl font-bold">{summary?.totalSessions || 0}</p>
          <p className="text-sm mt-2">This {selectedTimeframe}</p>
        </div>

        <div className="bg-chart-2 border-4 border-black shadow-brutal-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Avg Completion</h3>
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-3xl font-bold">{summary?.avgCompletion || 0}%</p>
          <p className="text-sm mt-2">Overall progress</p>
        </div>

        <div className="bg-chart-3 border-4 border-black shadow-brutal-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Engagement</h3>
            <BarChart3 className="w-8 h-8" />
          </div>
          <p className="text-3xl font-bold">{summary?.engagementRate || 0}%</p>
          <p className="text-sm mt-2">Activity level</p>
        </div>

        <div className="bg-chart-4 border-4 border-black shadow-brutal-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Total Time</h3>
            <Activity className="w-8 h-8" />
          </div>
          <p className="text-3xl font-bold">
            {summary?.totalDuration ? Math.round(summary.totalDuration / 60) : 0}m
          </p>
          <p className="text-sm mt-2">Play time</p>
        </div>
      </div>

      {/* Skills Progress */}
      {summary?.skills && summary.skills.length > 0 && (
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-2xl font-bold mb-6">Skill Development</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.skills.map((skill, index) => (
              <div key={skill.skill} className="bg-gray-50 border-2 border-black p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{skill.skill}</span>
                  <span className="text-lg font-bold">{skill.value}%</span>
                </div>
                <div className="w-full bg-gray-200 border-2 border-black h-4">
                  <div 
                    className="bg-chart-1 h-full transition-all duration-300"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Status */}
      <div className="bg-yellow-100 border-4 border-black shadow-brutal-lg p-6">
        <h3 className="text-xl font-bold mb-4">Analytics Status</h3>
        <p className="text-gray-700">
          Analytics data is collected from completed game sessions. 
          {!summary && " No data available for the selected timeframe and child(ren)."}
          {summary && ` Showing data for ${selectedChild ? children.find(c => c.id === selectedChild)?.name || 'Unknown Child' : 'all children'} over the past ${selectedTimeframe}.`}
        </p>
      </div>
    </div>
  )
}
