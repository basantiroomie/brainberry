"use client"
import { Users, User, Plus, BarChart3, Settings, X, Link2, CheckCircle2, RotateCcw, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from 'sonner'
import { useMockData } from './MockDataContext'
import { AvatarViewer } from '@/components/AvatarViewer'
import ChildAvatarDisplay from '@/app/child/components/ChildAvatarDisplay'

interface Child {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  notes?: string | null;
  access_code?: string | null;
  educator_id?: string;
  avatar_url?: string | null;
  avatar_headshot_url?: string | null;
  avatar_permissions?: {
    can_customize: boolean;
    can_chat: boolean;
    chat_time_limit_minutes: number;
  } | null;
}
interface Assignment { id: string; moldId: string; childId: string; status: string; progress: number; mold: { id: string; name: string; difficulty: string }; }
interface MoldLite { id: string; name: string; difficulty: string; primaryObjective: string; meta?: any }

// Generate random access code for children
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like 0, O, I, 1
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function ChildrenTab() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [childSubTab, setChildSubTab] = useState<string>("overview")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allMolds, setAllMolds] = useState<MoldLite[]>([])
  const [newChild, setNewChild] = useState({ name: '', age: '', diagnosis: 'HYBRID', accessCode: '' })
  const [assignModal, setAssignModal] = useState(false)
  const [assignMoldId, setAssignMoldId] = useState('')

  // Avatar management state (view only)
  // Avatar creation is now handled on child platform

  const { useMock, dataset, addChild, addAssignment, updateAssignmentProgress } = useMockData()

  // Debug logging
  useEffect(() => {
    console.log('ChildrenTab state debug:', {
      useMock,
      childrenCount: children.length,
      children: children,
      loading,
      selectedChild
    })
  }, [useMock, children, loading, selectedChild])

  // Generate access code only once when component mounts
  useEffect(() => {
    if (!newChild.accessCode) {
      setNewChild(prev => ({ ...prev, accessCode: generateAccessCode() }))
    }
  }, [newChild.accessCode])

  async function fetchChildren() {
    if (useMock) {
      setChildren((dataset?.children || []) as any);
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/children')
      if (res.ok) {
        const response = await res.json()
        // Handle wrapped response structure
        const childrenData = response.success ? response.data : response
        console.log('Fetched children data:', childrenData)
        setChildren(childrenData || [])
      } else {
        console.error('Failed to load children:', res.status)
        toast.error('Failed to load children')
      }
    } catch (error) {
      console.error('Error fetching children:', error)
      toast.error('Error loading children')
    } finally {
      setLoading(false)
    }
  }

  async function deleteChild(childId: string) {
    if (!confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      return
    }

    try {
      if (useMock) {
        setChildren(children.filter(child => child.id !== childId))
        toast.success('Child deleted (mock)')
        return
      }

      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setChildren(children.filter(child => child.id !== childId))
        toast.success('Child deleted successfully')
        // If we're viewing this child, go back to list
        if (selectedChild === childId) {
          setSelectedChild(null)
        }
      } else {
        toast.error('Failed to delete child')
      }
    } catch (error) {
      console.error('Error deleting child:', error)
      toast.error('Error deleting child')
    }
  }
  async function fetchAssignments(childId: string) {
    if (useMock) {
      const full = (dataset?.assignments || []).filter(a => a.childId === childId)
      // attach mold info from dataset molds
      const moldMap = Object.fromEntries((dataset?.molds || []).map(m => [m.id, m]))
      setAssignments(full.map(a => ({ ...a, mold: moldMap[a.moldId] || { id: a.moldId, name: 'Unknown', difficulty: 'Easy' } })) as any)
      return
    }
    const res = await fetch(`/api/assignments?childId=${childId}`)
    if (res.ok) setAssignments(await res.json())
  }
  async function fetchMolds() {
    if (useMock) { setAllMolds((dataset?.molds || []) as any); return }
    const res = await fetch('/api/molds')
    if (res.ok) setAllMolds(await res.json())
  }

  useEffect(() => { fetchChildren(); fetchMolds() }, [useMock])
  useEffect(() => { if (selectedChild) fetchAssignments(selectedChild) }, [selectedChild, useMock])

  async function createChild(e: React.FormEvent) {
    e.preventDefault()
    if (!newChild.name || !newChild.age || !newChild.accessCode) return
    if (useMock) {
      toast.success('Mock child added');
      addChild(newChild.name, Number(newChild.age), newChild.diagnosis);
      setChildren((dataset?.children || []) as any);
      setNewChild({ name: '', age: '', diagnosis: 'HYBRID', accessCode: generateAccessCode() });
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChild.name,
          age: Number(newChild.age),
          diagnosis: newChild.diagnosis,
          access_code: newChild.accessCode
        })
      })

      if (res.ok) {
        toast.success('Child created successfully!');
        setNewChild({ name: '', age: '', diagnosis: 'HYBRID', accessCode: generateAccessCode() });
        fetchChildren()
      } else {
        // Get detailed error message
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Create child error:', res.status, errorData)
        toast.error(`Failed to create child: ${errorData.error || 'Unknown error'} (Status: ${res.status})`)
      }
    } catch (error) {
      console.error('Network error:', error)
      toast.error('Network error - check your connection')
    } finally {
      setCreating(false)
    }
  }

  async function assignMold() {
    if (!assignMoldId || !selectedChild) return
    if (useMock) { toast.success('Mock assignment created'); addAssignment(selectedChild, assignMoldId); fetchAssignments(selectedChild); setAssignModal(false); setAssignMoldId(''); return }
    const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ child_id: selectedChild, mold_id: assignMoldId }) })
    if (res.ok) { toast.success('Mold assigned'); setAssignModal(false); setAssignMoldId(''); fetchAssignments(selectedChild) } else toast.error('Assign failed')
  }

  async function updateProgress(a: Assignment, delta: number) {
    const newProgress = Math.min(100, Math.max(0, a.progress + delta))
    if (useMock) { updateAssignmentProgress(a.id, newProgress); setAssignments(list => list.map(x => x.id === a.id ? { ...x, progress: newProgress, status: newProgress === 100 ? 'completed' : 'in-progress' } : x)); return }
    const res = await fetch(`/api/assignments/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: newProgress, status: newProgress === 100 ? 'completed' : 'in-progress' }) })
    if (res.ok) { toast.success('Progress updated'); fetchAssignments(a.childId) } else toast.error('Update failed')
  }

  // Avatar management functions

  async function removeAvatar(childId: string) {
    if (!confirm('Are you sure you want to delete this child\'s avatar? This action cannot be undone.')) {
      return
    }

    if (useMock) {
      toast.success('Avatar deleted (mock mode)')
      setChildren(children.map(child =>
        child.id === childId
          ? { ...child, avatar_url: undefined, avatar_headshot_url: undefined }
          : child
      ))
      return
    }

    try {
      // Update child to remove avatar URLs
      const response = await fetch(`/api/children/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_url: null,
          avatar_headshot_url: null,
        }),
      })

      if (response.ok) {
        toast.success('Avatar deleted successfully')
        fetchChildren() // Refresh to show updated state
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Failed to delete avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Avatar deletion error:', error)
      toast.error('Error deleting avatar')
    }
  }

  // Avatar creation is now handled on child platform
  // Educators can only view and delete avatars

  if (selectedChild) {
    const child = Array.isArray(children) ? children.find(c => c.id === selectedChild) : undefined
    return (
      <div className="space-y-6">
        {/* Child Header */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Avatar or placeholder in header */}
              <ChildAvatarDisplay
                avatarUrl={child?.avatar_url}
                headshotUrl={child?.avatar_headshot_url}
                childName={child?.name || 'Child'}
                size="large"
                autoGenerateFromAvatar={true}
              />
              <div>
                <h1 className="text-3xl font-bold">{child?.name} ({child?.age} years old)</h1>
                <p className="text-gray-600 text-sm">Diagnosis: {child?.diagnosis}</p>
                {child?.avatar_url && (
                  <div className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 border-2 border-black shadow-brutal inline-block transform -rotate-1">
                    <span className="text-sm font-bold flex items-center">
                      <span className="animate-spin mr-2">🎭</span>
                      Avatar Active & Ready!
                      <span className="ml-2 animate-bounce">🚀</span>
                    </span>
                  </div>
                )}
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
            {["overview", "assignments", "avatar", "progress", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setChildSubTab(tab)}
                className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${childSubTab === tab
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
                {assignments.slice(0, 2).map(a => (
                  <div key={a.id} className="border-2 border-gray-300 p-4">
                    <h3 className="font-bold mb-1">🎯 {a.mold.name}</h3>
                    <p className="text-gray-600 text-xs mb-2">{a.mold.difficulty} • {a.status}</p>
                    <div className="bg-gray-200 rounded-full h-2 mb-2"><div className="bg-chart-2 h-2 rounded-full" style={{ width: `${a.progress}%` }}></div></div>
                    <span className="text-xs font-bold text-gray-600">{a.progress}% Complete</span>
                  </div>
                ))}
                {assignments.length === 0 && <div className="border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 font-bold">No assignments yet – go to ASSIGNMENTS tab.</div>}
              </div>
            </div>
          )}
          {childSubTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Assignments</h2>
                <button onClick={() => setAssignModal(true)} className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal font-bold text-sm flex items-center space-x-2"><Link2 className="h-4 w-4" /><span>ASSIGN</span></button>
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
                {assignments.length === 0 && <div className="p-4 border-2 border-dashed border-black text-center text-xs font-bold text-gray-500">None yet</div>}
              </div>
            </div>
          )}

          {childSubTab === "avatar" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-4 border-purple-400 shadow-brutal-xl p-4 rounded-lg transform -rotate-1">
                <h2 className="text-3xl font-bold text-purple-800 flex items-center justify-center">
                  <span className="mr-3 text-4xl animate-spin">🎭</span>
                  Avatar Management Center
                  <span className="ml-3 text-4xl animate-bounce">✨</span>
                </h2>
                <p className="text-center text-purple-700 font-semibold mt-2">
                  Manage child-created avatars and permissions
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Avatar Display */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Current Avatar</h3>
                  <div className="bg-gray-50 border-2 border-black shadow-brutal p-4 h-80">
                    {child?.avatar_url && typeof child.avatar_url === 'string' && child.avatar_url.trim() !== '' ? (
                      <AvatarViewer
                        avatarUrl={child.avatar_url}
                        cameraMode="headshot"
                        enableControls={true}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-blue-50">
                        <div className="text-center p-6">
                          <div className="relative mb-4">
                            <User className="w-20 h-20 mx-auto text-gray-300" />
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              NEW!
                            </div>
                          </div>
                          <div className="bg-white border-2 border-blue-300 p-4 rounded-lg shadow-lg">
                            <p className="text-gray-800 font-bold mb-2 flex items-center justify-center">
                              <span className="mr-2">🎨</span>
                              No avatar created yet
                              <span className="ml-2">✨</span>
                            </p>
                            <p className="text-sm text-blue-600 font-semibold bg-blue-50 p-2 rounded">
                              🚀 Child can now create their own avatar from "My Stuff" section!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {child?.avatar_url && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => removeAvatar(child.id)}
                        className="bg-red-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>DELETE AVATAR</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Avatar Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Avatar Creation</h3>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-blue-400 shadow-brutal-xl p-6 transform rotate-1">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-6xl mb-3 animate-bounce">🎨</div>
                        <h4 className="font-bold text-blue-800 mb-2 text-xl">✨ NEW: Child-Created Avatars ✨</h4>
                        <div className="bg-yellow-200 border-2 border-yellow-400 p-3 rounded-lg mb-4">
                          <p className="text-sm font-bold text-yellow-800">
                            🚀 MAJOR UPDATE: Children can now create and customize their own avatars directly from their "My Stuff" section!
                          </p>
                        </div>
                        <p className="text-sm text-blue-700 mb-4">
                          This promotes self-expression and therapeutic engagement through personalized avatar creation.
                        </p>
                      </div>

                      <div className="bg-white border-4 border-green-400 shadow-brutal p-4 rounded transform -rotate-1">
                        <h5 className="font-bold text-green-800 mb-2 flex items-center">
                          <span className="text-lg mr-2">🌟</span>
                          Key Benefits:
                        </h5>
                        <ul className="text-sm text-green-700 space-y-2 list-none">
                          <li className="flex items-center"><span className="text-green-500 mr-2">✅</span>Enhanced self-expression and creativity</li>
                          <li className="flex items-center"><span className="text-green-500 mr-2">✅</span>Ownership of their learning experience</li>
                          <li className="flex items-center"><span className="text-green-500 mr-2">✅</span>Therapeutic engagement through customization</li>
                          <li className="flex items-center"><span className="text-green-500 mr-2">✅</span>Improved motivation and connection</li>
                        </ul>
                      </div>

                      <div className="bg-white border-4 border-orange-400 shadow-brutal p-4 rounded transform rotate-1">
                        <h5 className="font-bold text-orange-800 mb-2 flex items-center">
                          <span className="text-lg mr-2">🎛️</span>
                          Your Educator Controls:
                        </h5>
                        <ul className="text-sm text-orange-700 space-y-2 list-none">
                          <li className="flex items-center"><span className="text-orange-500 mr-2">👁️</span>View the child's current avatar</li>
                          <li className="flex items-center"><span className="text-red-500 mr-2">🗑️</span>Delete avatars when necessary</li>
                          <li className="flex items-center"><span className="text-blue-500 mr-2">📊</span>Monitor avatar usage in sessions</li>
                          <li className="flex items-center"><span className="text-purple-500 mr-2">⚙️</span>Set avatar permissions and limits</li>
                        </ul>
                      </div>

                      {child?.avatar_url && (
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-500 shadow-brutal-xl p-6 rounded-lg transform -rotate-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="relative">
                              <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                            </div>
                            <h5 className="font-bold text-green-800 text-lg flex items-center">
                              🎉 Avatar Successfully Created! 🎉
                            </h5>
                          </div>
                          <div className="bg-white border-2 border-green-400 p-3 rounded">
                            <p className="text-sm font-bold text-green-800 mb-2">
                              ✨ This child has successfully created their personalized avatar!
                            </p>
                            <p className="text-xs text-green-700">
                              They can now use it for interactive learning sessions, voice chats, and immersive educational experiences.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar Permissions */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 shadow-brutal-xl p-6 rounded-lg transform rotate-1">
                    <h4 className="text-xl font-bold mb-4 text-yellow-800 flex items-center">
                      <span className="mr-3 text-2xl">⚙️</span>
                      Avatar Permissions & Controls
                      <span className="ml-3 text-2xl animate-spin">🔧</span>
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={child?.avatar_permissions?.can_customize ?? true}
                          className="w-4 h-4 border-2 border-black"
                        />
                        <span className="text-sm font-medium">Allow child to customize avatar</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={child?.avatar_permissions?.can_chat ?? true}
                          className="w-4 h-4 border-2 border-black"
                        />
                        <span className="text-sm font-medium">Allow avatar chat interactions</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">Chat time limit (minutes):</span>
                        <input
                          type="number"
                          defaultValue={child?.avatar_permissions?.chat_time_limit_minutes ?? 30}
                          min="5"
                          max="120"
                          className="w-20 px-2 py-1 border-2 border-black text-sm"
                        />
                      </div>
                    </div>
                    <button className="mt-4 bg-yellow-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm">
                      SAVE PERMISSIONS
                    </button>
                  </div>
                </div>
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

        {/* Avatar creation is now handled on child platform */}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* New Feature Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 border-4 border-black shadow-brutal-xl p-6 transform rotate-1 mb-6">
        <div className="text-center text-white">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <span className="text-3xl animate-bounce">🎉</span>
            <h2 className="text-2xl font-bold">NEW AVATAR SYSTEM ACTIVE!</h2>
            <span className="text-3xl animate-bounce">🎨</span>
          </div>
          <p className="text-lg font-semibold mb-2">
            Children can now create their own personalized avatars!
          </p>
          <p className="text-sm opacity-90">
            Enhanced therapeutic engagement through self-expression and creativity
          </p>
        </div>
      </div>

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
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6 max-w-3xl mx-auto">
        <form onSubmit={createChild} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Name</label>
              <input value={newChild.name} onChange={e => setNewChild(c => ({ ...c, name: e.target.value }))} className="w-full border-2 border-black p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Age</label>
              <input type="number" value={newChild.age} onChange={e => setNewChild(c => ({ ...c, age: e.target.value }))} className="w-full border-2 border-black p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Diagnosis</label>
              <select value={newChild.diagnosis} onChange={e => setNewChild(c => ({ ...c, diagnosis: e.target.value }))} className="w-full border-2 border-black p-2 text-sm">
                <option value="ASD">ASD</option>
                <option value="ADHD">ADHD</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
          </div>
          <div className="bg-chart-4 text-white p-4 border-2 border-black shadow-brutal">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold mb-1">Child Access Code</label>
                <div className="text-2xl font-mono font-bold">{newChild.accessCode}</div>
              </div>
              <button type="button" onClick={() => setNewChild(c => ({ ...c, accessCode: generateAccessCode() }))} className="bg-white text-black px-3 py-1 border-2 border-black shadow-brutal hover:shadow-brutal-lg text-xs font-bold">
                REGENERATE
              </button>
            </div>
            <p className="text-xs mt-2">Give this code to the child for login</p>
          </div>
          <div className="text-right">
            <button disabled={creating} className="bg-chart-1 text-white px-6 py-2 border-2 border-black shadow-brutal font-bold text-sm inline-flex items-center space-x-2 disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}<span>ADD CHILD</span></button>
          </div>
        </form>
      </div>

      {/* Children List Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Children ({children.length})</h3>
        <button
          onClick={() => fetchChildren()}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 px-3 py-1 border-2 border-black shadow-brutal font-bold text-sm inline-flex items-center space-x-2 disabled:opacity-50"
          title="Refresh children list"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading && <div className="col-span-2 text-center text-sm font-bold text-gray-500">Loading...</div>}
        {Array.isArray(children) && children.map(child => (
          <div key={child.id} className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
            <div className="flex items-center space-x-4 mb-4">
              {/* Avatar or placeholder */}
              <ChildAvatarDisplay
                avatarUrl={child.avatar_url}
                headshotUrl={child.avatar_headshot_url}
                childName={child.name}
                size="large"
                autoGenerateFromAvatar={true}
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold">{child.name} (Age {child.age})</h3>
                <p className="text-gray-600 text-xs">Diagnosis: {child.diagnosis}</p>
                {/* Avatar status indicator */}
                <div className="flex items-center space-x-2 mt-1">
                  <div className="mt-1 bg-chart-4 text-white px-3 py-1 border border-black inline-block">
                    <span className="text-xs font-bold">Code: </span>
                    <span className="font-mono font-bold">{child.access_code}</span>
                  </div>
                  {child.avatar_url && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 border-2 border-black shadow-brutal inline-block transform rotate-1 animate-pulse">
                      <span className="text-xs font-bold flex items-center">
                        <span className="mr-1">🎭</span>
                        AVATAR ACTIVE
                        <span className="ml-1 animate-bounce">✨</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSelectedChild(child.id)} className="flex-1 bg-chart-2 text-white py-2 px-4 border-2 border-black shadow-brutal font-bold text-sm">VIEW PROFILE</button>
              <button onClick={() => deleteChild(child.id)} className="bg-red-500 text-white py-2 px-4 border-2 border-black shadow-brutal font-bold text-sm hover:bg-red-600 transition-colors">DELETE</button>
            </div>
          </div>
        ))}
        {!loading && Array.isArray(children) && children.length === 0 && (
          <div className="col-span-2 text-center space-y-4 p-8">
            <div className="text-lg font-bold text-gray-700">No children found</div>
            <div className="text-sm text-gray-600">
              {useMock ? (
                "Mock mode is enabled but no mock children are available."
              ) : (
                <div className="space-y-2">
                  <p>Either:</p>
                  <ul className="text-left inline-block space-y-1">
                    <li>• You haven't created any children yet</li>
                    <li>• You need to be authenticated as an educator</li>
                    <li>• The database connection isn't working properly</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-4">
                    Check the browser console for debugging information.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Assign Mold</h2>
            <select value={assignMoldId} onChange={e => setAssignMoldId(e.target.value)} className="w-full border-2 border-black p-2 font-bold">
              <option value="">Select a mold</option>
              {allMolds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setAssignModal(false); setAssignMoldId('') }} className="px-4 py-2 border-2 border-black bg-gray-300 font-bold text-sm">CANCEL</button>
              <button disabled={!assignMoldId} onClick={assignMold} className="px-5 py-2 border-2 border-black bg-chart-2 text-white font-bold text-sm disabled:opacity-40 inline-flex items-center space-x-2"><CheckCircle2 className="h-4 w-4" /><span>ASSIGN</span></button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar creation is now handled on child platform */}
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
        <MetricCard label="DURATION (MIN)" value={Math.round(data.totalDuration / 60)} color="chart-2" />
        <MetricCard label="AVG COMPLETION" value={data.avgCompletion + '%'} color="chart-3" />
        <MetricCard label="ENGAGEMENT" value={data.engagementRate + '%'} color="chart-4" />
      </div>
      {data.skills?.length > 0 && (
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
