"use client"
import { BarChart3, TrendingUp, Download, RefreshCw, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from 'sonner'
import { useMockData } from './MockDataContext'

interface Child { id: string; name: string }

export default function AnalyticsTab() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week")
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [children, setChildren] = useState<Child[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const { useMock } = useMockData()
  const [mockDataset, setMockDataset] = useState<any | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [insights, setInsights] = useState<any | null>(null)

  // Generate random mock data by default
  function generateRandomMockData() {
    const mockChildren = [
      { id: 'child-1', name: 'Arun' },
      { id: 'child-2', name: 'Aryan' },
      { id: 'child-3', name: 'Leo' },
      { id: 'child-4', name: 'Zen' },
      { id: 'child-5', name: 'Avanti' }
    ]

    const skillAreas = [
      'Attention & Focus', 'Working Memory', 'Executive Planning', 
      'Emotional Regulation', 'Social Skills', 'Problem Solving',
      'Impulse Control', 'Processing Speed', 'Visual Perception'
    ]

    // Generate random summary data
    const randomSummary = {
      totalSessions: Math.floor(Math.random() * 100) + 20,
      totalDuration: Math.floor(Math.random() * 10000) + 5000, // seconds
      avgCompletion: Math.floor(Math.random() * 40) + 60, // 60-100%
      engagementRate: Math.floor(Math.random() * 30) + 70, // 70-100%
      skills: skillAreas.slice(0, 6).map(skill => ({
        skill,
        value: Math.floor(Math.random() * 60) + 30 // 30-90%
      }))
    }

    // Generate timeline data
    const days = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : selectedTimeframe === 'quarter' ? 90 : 365
    const timelineData = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const sessions = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 5) + 1
      timelineData.push({
        day: date.toISOString().substring(0, 10),
        sessions,
        avgCompletion: sessions > 0 ? Math.floor(Math.random() * 40) + 60 : 0,
        engagement: sessions > 0 ? Math.floor(Math.random() * 30) + 70 : 0,
        duration: sessions * (Math.floor(Math.random() * 300) + 120)
      })
    }

    return {
      children: mockChildren,
      summary: randomSummary,
      timeline: timelineData
    }
  }

  function generateMockDataset(days: number) {
    const skillsPool = [
      'Working Memory','Impulse Control','Emotional Recognition','Sequencing','Attention Span','Planning','Social Turn-Taking','Inhibition','Task Switching','Visual Tracking','Auditory Processing'
    ]
  const childNames = ['Aarav','Diya','Vivaan','Anaya','Ishaan','Kavya']
    const today = new Date()
    function buildTimeline() {
      const arr: any[] = []
      for (let i = days-1; i >=0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate()-i)
        const sessions = Math.random() < 0.25 ? 0 : 1 + Math.floor(Math.random()*3)
        const avgCompletion = sessions === 0 ? 0 : 50 + Math.floor(Math.random()*45)
        const engagement = sessions === 0 ? 0 : 40 + Math.floor(Math.random()*55)
        const duration = sessions * (120 + Math.floor(Math.random()*300))
        arr.push({ day: d.toISOString().substring(0,10), sessions, avgCompletion, engagement, duration })
      }
      return arr
    }
    function buildChild(id: number, name: string) {
      const skills = skillsPool
        .sort(()=>0.5-Math.random())
        .slice(0,6)
        .map(skill => ({ skill, value: 25 + Math.floor(Math.random()*70) }))
      const tl = buildTimeline()
      const totalSessions = tl.reduce((a,b)=>a+b.sessions,0)
      const totalDuration = tl.reduce((a,b)=>a+b.duration,0)
      const avgCompletion = Math.round(tl.reduce((a,b)=>a+(b.avgCompletion||0),0) / (tl.filter(t=>t.sessions>0).length || 1))
      const engagementRate = Math.round(tl.reduce((a,b)=>a+(b.engagement||0),0) / (tl.filter(t=>t.sessions>0).length || 1))
      return { id: 'mock-'+id, name, totalSessions, totalDuration, avgCompletion, engagementRate, skills, timeline: tl }
    }
    const children = childNames.map((n,i)=>buildChild(i+1,n))
    // Aggregate
    const aggTimeline: any[] = []
    if (children[0]) {
      for (let i=0;i<children[0].timeline.length;i++) {
        const day = children[0].timeline[i].day
        const dayEntries = Array.isArray(children) ? children.map(c=>c.timeline[i]) : []
        const sessions = dayEntries.reduce((a,b)=>a+b.sessions,0)
        const duration = dayEntries.reduce((a,b)=>a+b.duration,0)
        const avgCompletion = Math.round(dayEntries.reduce((a,b)=>a+b.avgCompletion,0)/children.length)
        const engagement = Math.round(dayEntries.reduce((a,b)=>a+b.engagement,0)/children.length)
        aggTimeline.push({ day, sessions, duration, avgCompletion, engagement })
      }
    }
    const totalSessions = children.reduce((a,c)=>a+c.totalSessions,0)
    const totalDuration = children.reduce((a,c)=>a+c.totalDuration,0)
    // Aggregate skills by averaging values when skill appears
    const skillMap: Record<string,{ total:number; count:number }> = {}
    children.forEach(c=>{
      c.skills.forEach((s:any)=>{
        if(!skillMap[s.skill]) skillMap[s.skill] = { total:0, count:0 }
        skillMap[s.skill].total += s.value; skillMap[s.skill].count += 1
      })
    })
    const aggSkills = Object.entries(skillMap).map(([skill,data])=>({ skill, value: Math.round(data.total/data.count) }))
    const avgCompletion = Math.round(children.reduce((a,c)=>a+c.avgCompletion,0)/children.length)
    const engagementRate = Math.round(children.reduce((a,c)=>a+c.engagementRate,0)/children.length)
    return { children, aggregate: { totalSessions, totalDuration, avgCompletion, engagementRate, skills: aggSkills, timeline: aggTimeline } }
  }

  function deriveInsights(data: any) {
    if(!data || !data.skills || !Array.isArray(data.skills)) {
      return { strengths: [], focus: [], momentum: null }
    }
    const skillsSorted = [...data.skills].sort((a:any,b:any)=>b.value-a.value)
    const strengths = skillsSorted.slice(0,3)
    const focus = skillsSorted.slice(-3).reverse()
    // Engagement momentum: compare last third vs first third of timeline sessions or engagement
    let momentum: string | null = null
    if (data.timeline && Array.isArray(data.timeline) && data.timeline.length >= 6) {
      const third = Math.floor(data.timeline.length/3)
      const first = data.timeline.slice(0,third)
      const last = data.timeline.slice(-third)
      const firstEng = first.reduce((a:number,b:any)=>a+(b.engagement||0),0)/(first.length||1)
      const lastEng = last.reduce((a:number,b:any)=>a+(b.engagement||0),0)/(last.length||1)
      const diff = lastEng - firstEng
      momentum = diff > 5 ? 'Improving' : diff < -5 ? 'Declining' : 'Stable'
    }
    return { strengths, focus, momentum }
  }

  async function loadChildren() {
    // Children are loaded in loadSummary with random mock data
    return

    // Original API logic (commented out)
    /*
    if (useMock) {
      // children set when dataset generated
      return
    }
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        const c = await res.json()
        // Ensure we always set an array
        setChildren(Array.isArray(c) ? c : (c?.data || []))
      } else {
        setChildren([])
      }
    } catch (error) {
      console.error('Error loading children:', error)
      setChildren([])
    }
    */
  }
  async function loadSummary() {
    // Always use random mock data by default
    const mockData = generateRandomMockData()
    setChildren(mockData.children)
    setSummary(mockData.summary)
    setTimeline(mockData.timeline)
    setInsights(deriveInsights(mockData.summary))
    return

    // Original API logic (commented out for now)
    /*
    if (useMock) {
      const days = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : selectedTimeframe === 'quarter' ? 90 : 365
      // Regenerate dataset when timeframe changes or none exists
      if(!mockDataset || mockDataset.__days !== days) {
        const ds = generateMockDataset(days)
        ;(ds as any).__days = days
        setMockDataset(ds)
        setChildren(ds.children)
        const target = selectedChild ? ds.children.find((c:any)=>c.id===selectedChild) : ds.aggregate
        if (target) {
          setSummary(target)
          setTimeline(target.timeline || [])
          setInsights(deriveInsights(target))
        }
      } else {
        const ds = mockDataset
        const target = selectedChild ? ds.children.find((c:any)=>c.id===selectedChild) : ds.aggregate
        if (target) {
          setSummary(target)
          setTimeline(target.timeline || [])
          setInsights(deriveInsights(target))
        }
      }
      return
    }
    setLoading(true)
    try {
      const days = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : selectedTimeframe === 'quarter' ? 90 : 365
      const qs = new URLSearchParams()
      if (selectedChild) qs.set('childId', selectedChild)
      qs.set('days', String(days))
      const res = await fetch(`/api/analytics/summary?${qs.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
        setTimeline([]) // real timeline not implemented yet
        setInsights(deriveInsights(data))
      }
      else toast.error('Failed to load analytics')
    } finally { setLoading(false) }
    */
  }
  useEffect(() => { loadChildren() }, [])
  useEffect(() => { loadSummary() }, [selectedChild, selectedTimeframe, useMock])

  const timeframes = [
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "quarter", name: "This Quarter" },
    { id: "year", name: "This Year" }
  ]

  const progressData = (summary?.skills || []).map((s: any) => ({ skill: s.skill, current: s.value, previous: s.value, trend: 'up' }))

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
              <select value={selectedChild} onChange={e=>setSelectedChild(e.target.value)} className="border-2 border-black p-3 font-bold">
                <option value="">All Children</option>
                {Array.isArray(children) && children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <div className="flex space-x-3 flex-wrap">
            <button onClick={loadSummary} className="bg-chart-4 text-white px-6 py-3 border-2 border-black shadow-brutal font-bold flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 ${loading? 'animate-spin':''}`} />
              <span>{loading ? 'LOADING' : 'REFRESH'}</span>
            </button>
            <button className="bg-chart-3 text-white px-6 py-3 border-2 border-black shadow-brutal font-bold flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>EXPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Metric value={summary?.totalSessions ?? 0} label="TOTAL SESSIONS" color="chart-1" />
        <Metric value={summary ? Math.round((summary.totalDuration/3600)*10)/10+'h' : '0h'} label="TOTAL TIME" color="chart-2" />
        <Metric value={(summary?.avgCompletion ?? 0)+ '%'} label="AVG COMPLETION" color="chart-3" />
        <Metric value={(summary?.engagementRate ?? 0)+ '%'} label="ENGAGEMENT" color="chart-4" />
      </div>

      {/* Progress by Skill Area */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
          <span>Progress by Skill Area</span>
        </h2>
        <div className="space-y-4">
          {progressData.map((skill: any, index: number) => (
            <div key={index} className="border-2 border-gray-200 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{skill.skill}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{skill.current}%</span>
                  <div className={`flex items-center text-sm ${
                    skill.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-4 w-4 mr-1 ${
                      skill.trend === 'down' ? 'rotate-180' : ''
                    }`} />
                    <span>{skill.trend === 'up' ? '+' : ''}{skill.current - skill.previous}%</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-chart-2 h-3 rounded-full transition-all duration-500"
                  style={{width: `${skill.current}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Activity className="h-6 w-6 text-chart-4" />
          <span>Engagement Timeline</span>
        </h2>
        {timeline.length === 0 && (
          <div className="text-xs font-bold text-gray-500">
            Loading timeline data...
          </div>
        )}
        {timeline.length > 0 && (
          <div className="space-y-2">
            {timeline.map(t => {
              const maxSessions = Math.max(...timeline.map(x=>x.sessions||0),1)
              const barWidth = Math.round((t.sessions / maxSessions) * 100)
              return (
                <div key={t.day} className="flex items-center space-x-3 text-xs font-bold">
                  <div className="w-20 text-right">{t.day.substring(5)}</div>
                  <div className="flex-1 bg-gray-200 h-4 relative">
                    <div className="bg-chart-4 h-4" style={{ width: barWidth+'%' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px]">{t.sessions} sess</div>
                  </div>
                  <div className="w-16 text-chart-2">{t.avgCompletion || 0}%</div>
                </div>
              )
            })}
          </div>
        )}
        {timeline.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
            <div className="p-2 bg-gray-50 border">Peak Day: {timeline.reduce((a,b)=>b.sessions>a.sessions?b:a, timeline[0]).day.substring(5)}</div>
            <div className="p-2 bg-gray-50 border">Avg Sessions: {(timeline.reduce((a,b)=>a+b.sessions,0)/timeline.length).toFixed(1)}</div>
            <div className="p-2 bg-gray-50 border">Avg Completion: {Math.round(timeline.reduce((a,b)=>a+(b.avgCompletion||0),0)/(timeline.filter(t=>t.sessions>0).length||1))}%</div>
            <div className="p-2 bg-gray-50 border">Avg Engagement: {Math.round(timeline.reduce((a,b)=>a+(b.engagement||0),0)/(timeline.filter(t=>t.sessions>0).length||1))}%</div>
          </div>
        )}
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Skill Snapshot</h3>
          </div>
          <div className="space-y-3">
            {progressData.slice(0,5).map((skill: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                <span className="font-bold text-sm">{skill.skill}</span>
                <span className="text-chart-2 font-bold text-sm">{skill.current}%</span>
              </div>
            ))}
            {progressData.length===0 && <div className="text-xs text-center font-bold text-gray-500">No skill data yet</div>}
          </div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4">Deeper Insights</h3>
          {insights ? (
            <div className="space-y-4 text-sm font-bold">
              <div>
                <div className="mb-1">Top Strengths</div>
                <ul className="space-y-1">
                  {Array.isArray(insights.strengths) && insights.strengths.map((s:any)=>(<li key={s.skill} className="flex justify-between bg-gray-50 border px-2 py-1"><span>{s.skill}</span><span className="text-chart-2">{s.value}%</span></li>))}
                </ul>
              </div>
              <div>
                <div className="mb-1">Focus Areas</div>
                <ul className="space-y-1">
                  {Array.isArray(insights.focus) && insights.focus.map((s:any)=>(<li key={s.skill} className="flex justify-between bg-gray-50 border px-2 py-1"><span>{s.skill}</span><span className="text-red-600">{s.value}%</span></li>))}
                </ul>
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-2 border">
                <span>Engagement Momentum</span>
                <span className={insights.momentum==='Improving' ? 'text-green-600' : insights.momentum==='Declining' ? 'text-red-600' : 'text-gray-600'}>{insights.momentum || 'n/a'}</span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold">Generated heuristics; not a clinical assessment.</div>
            </div>
          ) : (
            <div className="text-xs font-bold text-gray-500">No insights yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ value, label, color }: { value: any; label: string; color: string }) {
  return (
    <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
      <div className={`text-3xl font-bold text-${color} mb-2`}>{value}</div>
      <div className="text-sm font-bold text-gray-600">{label}</div>
    </div>
  )
}
