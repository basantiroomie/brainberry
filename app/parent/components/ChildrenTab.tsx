"use client"
import { Users, User, Plus, BarChart3, Settings, Palette, Loader2, Link2, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

interface Child { 
  id: string
  name: string
  age: number
  diagnosis: string
  notes?: string | null
  accessCode: string
}

interface Assignment { 
  id: string
  moldId: string
  childId: string
  status: string
  progress: number
  mold: { id: string; name: string; difficulty: string }
}

interface MoldLite { 
  id: string
  name: string
  difficulty: string
  primaryObjective: string
  meta?: any
}

export default function ChildrenTab() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [childSubTab, setChildSubTab] = useState<string>("overview")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allMolds, setAllMolds] = useState<MoldLite[]>([])
  const [newChild, setNewChild] = useState({ name: '', age: '', diagnosis: 'HYBRID' })
  const [assignModal, setAssignModal] = useState(false)
  const [assignMoldId, setAssignMoldId] = useState('')

  async function fetchChildren() {
    setLoading(true)
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch('/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        setChildren(await res.json())
      } else {
        console.error('Failed to load children')
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally { 
      setLoading(false) 
    }
  }

  async function fetchAssignments(childId: string) {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch(`/api/assignments?childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) setAssignments(await res.json())
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  async function fetchMolds() {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch('/api/molds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) setAllMolds(await res.json())
    } catch (error) {
      console.error('Error fetching molds:', error)
    }
  }

  useEffect(() => { 
    fetchChildren()
    fetchMolds() 
  }, [])
  
  useEffect(() => { 
    if (selectedChild) fetchAssignments(selectedChild) 
  }, [selectedChild])

  async function createChild(e: React.FormEvent) {
    e.preventDefault()
    if (!newChild.name || !newChild.age) return
    
    setCreating(true)
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch('/api/children', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          name: newChild.name, 
          age: Number(newChild.age), 
          diagnosis: newChild.diagnosis 
        }) 
      })
      
      if (res.ok) { 
        console.log('Child created successfully')
        setNewChild({ name: '', age: '', diagnosis: 'HYBRID' })
        fetchChildren() 
      } else {
        console.error('Failed to create child')
      }
    } catch (error) {
      console.error('Error creating child:', error)
    } finally { 
      setCreating(false) 
    }
  }

  async function assignMold() {
    if (!assignMoldId || !selectedChild) return
    
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch('/api/assignments', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          childId: selectedChild, 
          moldId: assignMoldId 
        }) 
      })
      
      if (res.ok) { 
        console.log('Mold assigned successfully')
        setAssignModal(false)
        setAssignMoldId('')
        fetchAssignments(selectedChild) 
      } else {
        console.error('Failed to assign mold')
      }
    } catch (error) {
      console.error('Error assigning mold:', error)
    }
  }

  async function updateProgress(assignment: Assignment, delta: number) {
    const newProgress = Math.min(100, Math.max(0, assignment.progress + delta))
    
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch(`/api/assignments/${assignment.id}`, { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ 
          progress: newProgress, 
          status: newProgress === 100 ? 'completed' : 'in-progress' 
        }) 
      })
      
      if (res.ok) { 
        console.log('Progress updated successfully')
        fetchAssignments(assignment.childId) 
      } else {
        console.error('Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  if (selectedChild) {
    const child = children.find(c => c.id === selectedChild)
    return (
      <div className="space-y-6">
        {/* Child Header */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-chart-2 text-white rounded-full w-16 h-16 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{child?.name} ({child?.age} years old)</h1>
                <p className="text-gray-600 text-sm">Diagnosis: {child?.diagnosis}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedChild(null)}
              className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              ← BACK TO LIST
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex space-x-2">
            {["overview", "assignments", "progress", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setChildSubTab(tab)}
                className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${
                  childSubTab === tab
                    ? "bg-chart-2 text-white shadow-brutal-lg -rotate-1"
                    : "bg-main text-main-foreground hover:rotate-1"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-tab Content */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          {childSubTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Current Goals & Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.slice(0,2).map(a => (
                  <div key={a.id} className="border-2 border-gray-300 p-4">
                    <h3 className="font-bold mb-1">🎯 {a.mold.name}</h3>
                    <p className="text-gray-600 text-xs mb-2">{a.mold.difficulty} • {a.status}</p>
                    <div className="bg-gray-200 rounded-full h-2 mb-2"><div className="bg-chart-2 h-2 rounded-full" style={{ width: `${a.progress}%` }}></div></div>
                    <span className="text-xs font-bold text-gray-600">{a.progress}% Complete</span>
                  </div>
                ))}
                {assignments.length===0 && <div className="border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 font-bold">No assignments yet – go to ASSIGNMENTS tab.</div>}
              </div>
            </div>
          )}
          {childSubTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Assignments</h2>
                <button onClick={() => setAssignModal(true)} className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal font-bold text-sm flex items-center space-x-2"><Link2 className="h-4 w-4"/><span>ASSIGN</span></button>
              </div>
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="p-4 border-2 border-black bg-secondary flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{a.mold.name}</div>
                      <div className="text-[10px] text-gray-600 font-bold">{a.status.toUpperCase()} • {a.progress}%</div>
                      <div className="bg-gray-200 rounded-full h-2 mt-1 w-40"><div className="bg-chart-3 h-2 rounded-full" style={{ width: `${a.progress}%` }}></div></div>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => updateProgress(a, 10)} className="px-2 py-1 border-2 border-black bg-white text-xs font-bold">+10%</button>
                      <button onClick={() => updateProgress(a, -10)} className="px-2 py-1 border-2 border-black bg-white text-xs font-bold">-10%</button>
                      <a href={`/molds/${a.moldId}`} target="_blank" className="px-2 py-1 border-2 border-black bg-chart-1 text-white text-xs font-bold">PLAY</a>
                    </div>
                  </div>
                ))}
                {assignments.length===0 && <div className="p-4 border-2 border-dashed border-black text-center text-xs font-bold text-gray-500">None yet</div>}
              </div>
            </div>
          )}

      {childSubTab === "progress" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Detailed Analytics</h2>
              {child && <ChildAnalytics childId={child.id} />}
            </div>
          )}

          {childSubTab === "customize" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Game Customization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Game Theme:</label>
                  <select className="border-2 border-black p-2 w-full">
                    <option>🦕 Dinosaur World</option>
                    <option>🚀 Space Adventure</option>
                    <option>🏰 Medieval Castle</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2">Difficulty Level:</label>
                  <input type="range" min="1" max="5" defaultValue="3" className="w-full" />
                </div>
                <div>
                  <label className="block font-bold mb-2">Reward System:</label>
                  <select className="border-2 border-black p-2 w-full">
                    <option>🏆 Trophies & Badges</option>
                    <option>⭐ Star Collection</option>
                    <option>🎁 Unlockable Content</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {childSubTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Display Name:</label>
                  <input type="text" defaultValue={child?.name} className="border-2 border-black p-2 w-full" />
                </div>
                <div>
                  <label className="block font-bold mb-2">Daily Time Limit:</label>
                  <select className="border-2 border-black p-2 w-full">
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2">Permissions:</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      Allow Free Play access
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      Enable progress sharing
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-1 mb-4">
            CHILDREN
          </h1>
          <p className="text-lg text-gray-700">
            Manage all your children's profiles and progress
          </p>
        </div>
      </div>

      {/* Add New Child Button */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={createChild} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">Name</label>
            <input value={newChild.name} onChange={e=>setNewChild(c=>({...c,name:e.target.value}))} className="w-full border-2 border-black p-2 text-sm" required />
          </div>
            <div>
              <label className="block text-xs font-bold mb-1">Age</label>
              <input type="number" value={newChild.age} onChange={e=>setNewChild(c=>({...c,age:e.target.value}))} className="w-full border-2 border-black p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Diagnosis</label>
              <select value={newChild.diagnosis} onChange={e=>setNewChild(c=>({...c,diagnosis:e.target.value}))} className="w-full border-2 border-black p-2 text-sm">
                <option value="ASD">ASD</option>
                <option value="ADHD">ADHD</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
            <div className="md:col-span-4 text-right">
              <button disabled={creating} className="bg-chart-1 text-white px-6 py-2 border-2 border-black shadow-brutal font-bold text-sm inline-flex items-center space-x-2 disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}<span>ADD CHILD</span></button>
            </div>
        </form>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading && <div className="col-span-2 text-center text-sm font-bold text-gray-500">Loading...</div>}
        {children.map(child => (
          <div key={child.id} className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-white rounded-full w-16 h-16 flex items-center justify-center bg-chart-2">
                <User className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{child.name} (Age {child.age})</h3>
                <p className="text-gray-600 text-xs">Diagnosis: {child.diagnosis}</p>
              </div>
            </div>
            <button onClick={() => setSelectedChild(child.id)} className="w-full bg-chart-2 text-white py-2 px-4 border-2 border-black shadow-brutal font-bold text-sm">VIEW PROFILE</button>
          </div>
        ))}
        {!loading && children.length===0 && <div className="col-span-2 text-center text-sm font-bold text-gray-500">No children yet – add one above.</div>}
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Assign Mold</h2>
            <select value={assignMoldId} onChange={e=>setAssignMoldId(e.target.value)} className="w-full border-2 border-black p-2 font-bold">
              <option value="">Select a mold</option>
              {allMolds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={()=>{setAssignModal(false); setAssignMoldId('')}} className="px-4 py-2 border-2 border-black bg-gray-300 font-bold text-sm">CANCEL</button>
              <button disabled={!assignMoldId} onClick={assignMold} className="px-5 py-2 border-2 border-black bg-chart-2 text-white font-bold text-sm disabled:opacity-40 inline-flex items-center space-x-2"><CheckCircle2 className="h-4 w-4"/><span>ASSIGN</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChildAnalytics({ childId }: { childId: string }) {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => { (async () => { setLoading(true); try { const res = await fetch(`/api/analytics/summary?childId=${childId}&days=30`); if (res.ok) setData(await res.json()) } finally { setLoading(false) } })() }, [childId])
  if (loading) return <div className="text-center text-sm font-bold text-gray-500">Loading analytics...</div>
  if (!data) return <div className="text-center text-sm font-bold text-gray-500">No data yet</div>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="SESSIONS" value={data.totalSessions} color="chart-1" />
        <MetricCard label="DURATION (MIN)" value={Math.round(data.totalDuration/60)} color="chart-2" />
        <MetricCard label="AVG COMPLETION" value={data.avgCompletion + '%'} color="chart-3" />
        <MetricCard label="ENGAGEMENT" value={data.engagementRate + '%'} color="chart-4" />
      </div>
      {data.skills?.length>0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Skill Metrics</h3>
          <div className="space-y-2">
            {data.skills.map((s: any) => (
              <div key={s.skill} className="flex items-center space-x-3">
                <div className="w-32 text-xs font-bold">{s.skill}</div>
                <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden"><div className="bg-chart-2 h-3" style={{ width: `${s.value}%` }}></div></div>
                <div className="w-10 text-xs font-bold text-right">{s.value}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className={`bg-white border-4 border-black shadow-brutal-xl p-4 text-center`}> 
      <div className={`text-2xl font-bold text-${color} mb-1`}>{value}</div>
      <div className="text-[10px] font-bold text-gray-600 tracking-wide">{label}</div>
    </div>
  )
}
