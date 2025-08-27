"use client"
import { Users, User, Plus, BarChart3, Settings, Palette, Loader2, Link2, CheckCircle2, Upload, Camera, X, RotateCcw, Code } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { toast } from 'sonner'
import { useMockData } from './MockDataContext'
import { AvatarViewer } from '@/components/AvatarViewer'
import { AvatarCodeUtils } from '@/lib/avatar-utils'
import { avatarCodeSchema } from '@/lib/schemas'
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

// Avatar Creator Modal Component
interface AvatarCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  child: Child
  onAvatarSaved: () => void
}

function AvatarCreatorModal({ isOpen, onClose, child, onAvatarSaved }: AvatarCreatorModalProps) {
  const [step, setStep] = useState<'iframe' | 'code'>('iframe')
  const [avatarCode, setAvatarCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [saving, setSaving] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  
  // Ready Player Me iframe configuration
  const rpmSubdomain = process.env.NEXT_PUBLIC_RPM_SUBDOMAIN || 'demo'
  const iframeUrl = `https://${rpmSubdomain}.readyplayer.me/avatar?frameApi`

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('iframe')
      setAvatarCode('')
      setCodeError('')
      setSaving(false)
      setIframeLoaded(false)
    }
  }, [isOpen])

  // Handle avatar code input
  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setAvatarCode(upperValue)
    setCodeError('')
    
    // Validate code format as user types
    if (upperValue.length === 6) {
      try {
        avatarCodeSchema.parse({ code: upperValue })
      } catch (error) {
        setCodeError('Invalid code format. Must be 6 uppercase letters and numbers.')
      }
    }
  }

  // Save avatar with code
  const handleSaveAvatar = async () => {
    if (!avatarCode) {
      setCodeError('Please enter an avatar code')
      return
    }

    try {
      // Validate code format
      avatarCodeSchema.parse({ code: avatarCode })
      
      // Convert code to URLs
      const { glbUrl, pngUrl } = AvatarCodeUtils.codeToUrls(avatarCode)
      
      setSaving(true)
      
      // Update child with avatar URLs
      const response = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: glbUrl,
          avatar_headshot_url: pngUrl,
        }),
      })

      if (response.ok) {
        toast.success('Avatar saved successfully!')
        onAvatarSaved()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Failed to save avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Avatar save error:', error)
      if (error instanceof Error && error.message.includes('code')) {
        setCodeError('Invalid avatar code format. Must be 6 uppercase letters and numbers.')
      } else {
        toast.error('Error saving avatar')
      }
    } finally {
      setSaving(false)
    }
  }

  // Handle iframe messages from Ready Player Me
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== `https://${rpmSubdomain}.readyplayer.me`) return
      
      const { eventName, data } = event.data
      
      switch (eventName) {
        case 'v1.frame.ready':
          setIframeLoaded(true)
          break
        case 'v1.avatar.exported':
          // Avatar creation completed, move to code input step
          setStep('code')
          toast.success('Avatar created! Please enter the avatar code to save it.')
          break
        case 'v1.user.set':
          console.log('User set in Ready Player Me:', data)
          break
      }
    }

    if (isOpen) {
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }
  }, [isOpen, rpmSubdomain])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-brutal-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-chart-2 text-white p-4 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create Avatar for {child.name}</h2>
            <button
              onClick={onClose}
              className="bg-white text-black p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg"
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {step === 'iframe' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-300 p-4">
                <h3 className="font-bold text-blue-800 mb-2">📋 Instructions</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Use the Ready Player Me interface below to create an avatar</li>
                  <li>Take or upload a photo when prompted</li>
                  <li>Customize the avatar as desired</li>
                  <li>Click "Done" or "Export" when finished</li>
                  <li>You'll then be asked to enter the avatar code</li>
                </ol>
              </div>

              {/* Ready Player Me Iframe */}
              <div className="relative bg-gray-100 border-2 border-black" style={{ height: '600px' }}>
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-chart-2" />
                      <p className="text-sm font-bold text-gray-600">Loading Ready Player Me...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-none"
                  allow="camera *; microphone *"
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  disabled={saving}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => setStep('code')}
                  className="bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                >
                  SKIP TO CODE ENTRY
                </button>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 p-4">
                <h3 className="font-bold text-green-800 mb-2">✅ Avatar Created!</h3>
                <p className="text-sm text-green-700">
                  Your avatar has been created in Ready Player Me. Please enter the 6-character avatar code to save it to {child.name}'s profile.
                </p>
              </div>

              {/* Avatar Code Input */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Avatar Code</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={avatarCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Enter 6-character code (e.g., ABC123)"
                        className={`w-full border-2 p-3 text-lg font-mono uppercase tracking-wider ${
                          codeError ? 'border-red-500' : 'border-black'
                        }`}
                        maxLength={6}
                        disabled={saving}
                      />
                      {codeError && (
                        <p className="text-red-600 text-sm mt-1 font-bold">{codeError}</p>
                      )}
                    </div>
                    <Code className="h-6 w-6 text-gray-400" />
                  </div>
                </div>

                {/* Code Format Help */}
                <div className="bg-gray-50 border-2 border-gray-300 p-4">
                  <h4 className="font-bold mb-2">Where to find your avatar code:</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Look for a 6-character code like "ABC123" in the Ready Player Me interface</li>
                    <li>The code appears after clicking "Done" or "Export"</li>
                    <li>It may be shown in a URL or as a separate code</li>
                    <li>Only letters A-Z and numbers 0-9 are used</li>
                  </ul>
                </div>

                {/* Preview URLs */}
                {avatarCode.length === 6 && !codeError && (
                  <div className="bg-blue-50 border-2 border-blue-300 p-4">
                    <h4 className="font-bold mb-2">Preview URLs:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div>
                        <span className="font-bold">3D Model:</span> {AvatarCodeUtils.codeToGlbUrl(avatarCode)}
                      </div>
                      <div>
                        <span className="font-bold">Headshot:</span> {AvatarCodeUtils.codeToPngUrl(avatarCode)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('iframe')}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  disabled={saving}
                >
                  ← BACK TO CREATOR
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={!avatarCode || codeError || saving}
                  className={`px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 ${
                    !avatarCode || codeError || saving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-chart-2 text-white'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>SAVE AVATAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
  
  // Avatar management state
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Avatar Creator Modal state
  const [showAvatarCreator, setShowAvatarCreator] = useState(false)
  const [avatarCreatorChildId, setAvatarCreatorChildId] = useState<string | null>(null)

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
      setChildren((dataset?.children||[]) as any); 
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
      const full = (dataset?.assignments||[]).filter(a=>a.childId===childId)
      // attach mold info from dataset molds
      const moldMap = Object.fromEntries((dataset?.molds||[]).map(m=>[m.id,m]))
      setAssignments(full.map(a => ({ ...a, mold: moldMap[a.moldId] || { id:a.moldId, name:'Unknown', difficulty:'Easy' } })) as any)
      return
    }
    const res = await fetch(`/api/assignments?childId=${childId}`)
    if (res.ok) setAssignments(await res.json())
  }
  async function fetchMolds() {
    if (useMock) { setAllMolds((dataset?.molds||[]) as any); return }
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
      setChildren((dataset?.children||[]) as any); 
      setNewChild({ name:'', age:'', diagnosis:'HYBRID', accessCode: generateAccessCode() }); 
      return 
    }
    setCreating(true)
    try {
      const res = await fetch('/api/children', { 
        method: 'POST', 
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ 
          name: newChild.name, 
          age: Number(newChild.age), 
          diagnosis: newChild.diagnosis, 
          access_code: newChild.accessCode 
        }) 
      })
      
      if (res.ok) { 
        toast.success('Child created successfully!'); 
        setNewChild({ name:'', age:'', diagnosis:'HYBRID', accessCode: generateAccessCode() }); 
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
    const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ child_id: selectedChild, mold_id: assignMoldId }) })
    if (res.ok) { toast.success('Mold assigned'); setAssignModal(false); setAssignMoldId(''); fetchAssignments(selectedChild) } else toast.error('Assign failed')
  }

  async function updateProgress(a: Assignment, delta: number) {
    const newProgress = Math.min(100, Math.max(0, a.progress + delta))
  if (useMock) { updateAssignmentProgress(a.id, newProgress); setAssignments(list => list.map(x=> x.id===a.id ? { ...x, progress:newProgress, status: newProgress===100 ? 'completed':'in-progress' } : x)); return }
    const res = await fetch(`/api/assignments/${a.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ progress: newProgress, status: newProgress===100? 'completed':'in-progress' }) })
    if (res.ok) { toast.success('Progress updated'); fetchAssignments(a.childId) } else toast.error('Update failed')
  }

  // Avatar management functions
  async function handleAvatarUpload(file: File, childId: string) {
    if (!file) return
    
    // Validate file type and size
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error('Please upload a JPEG or PNG image')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    if (useMock) {
      toast.success('Avatar created (mock mode)')
      // Update the child in the local state with a mock avatar URL
      setChildren(children.map(child => 
        child.id === childId 
          ? { 
              ...child, 
              avatar_url: 'https://models.readyplayer.me/68ad29be1b10d8c48a4e516d.glb', // Use a known working avatar
              avatar_headshot_url: 'https://models.readyplayer.me/68ad29be1b10d8c48a4e516d.glb' // For now, use same URL
            }
          : child
      ))
      return
    }

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('childId', childId)

      const response = await fetch('/api/avatars/create-from-photo', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Avatar created successfully!')
        // Refresh children data to get updated avatar URLs
        fetchChildren()
      } else {
        toast.error(result.error || 'Failed to create avatar')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Error uploading avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent, childId: string) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleAvatarUpload(files[0], childId)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, childId: string) {
    const files = e.target.files
    if (files && files.length > 0) {
      handleAvatarUpload(files[0], childId)
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function removeAvatar(childId: string) {
    if (!confirm('Are you sure you want to remove this avatar?')) {
      return
    }

    if (useMock) {
      toast.success('Avatar removed (mock mode)')
      setChildren(children.map(child => 
        child.id === childId 
          ? { ...child, avatar_url: undefined, avatar_headshot_url: undefined }
          : child
      ))
      return
    }

    try {
      const response = await fetch('/api/avatars/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId })
      })

      if (response.ok) {
        toast.success('Avatar removed successfully')
        fetchChildren()
      } else {
        toast.error('Failed to remove avatar')
      }
    } catch (error) {
      console.error('Avatar removal error:', error)
      toast.error('Error removing avatar')
    }
  }

  // Open avatar creator modal
  function openAvatarCreator(childId: string) {
    setAvatarCreatorChildId(childId)
    setShowAvatarCreator(true)
  }

  // Handle avatar saved from modal
  function handleAvatarSaved() {
    fetchChildren() // Refresh children data to show new avatar
  }

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
                  <div className="mt-1 bg-green-500 text-white px-2 py-1 border border-black inline-block">
                    <span className="text-xs font-bold">🎭 Avatar Active</span>
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

          {childSubTab === "avatar" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Avatar Management</h2>
              
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
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="text-center">
                          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 font-bold">No avatar created yet</p>
                          <p className="text-sm text-gray-500 mt-1">Upload a photo to create an avatar</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openAvatarCreator(child.id)}
                      className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>{child?.avatar_url ? 'REPLACE AVATAR' : 'CREATE AVATAR'}</span>
                    </button>
                    {child?.avatar_url && (
                      <button
                        onClick={() => removeAvatar(child.id)}
                        className="bg-red-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>REMOVE AVATAR</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Interface */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">
                    {child?.avatar_url ? 'Replace Avatar' : 'Create Avatar'}
                  </h3>
                  
                  {/* Drag and Drop Area */}
                  <div
                    className={`border-4 border-dashed p-8 text-center transition-all ${
                      dragActive 
                        ? 'border-chart-2 bg-chart-2/10' 
                        : 'border-gray-300 hover:border-gray-400'
                    } ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, child?.id || '')}
                  >
                    {avatarUploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-chart-2" />
                        <div>
                          <p className="font-bold text-chart-2">Creating Avatar...</p>
                          <p className="text-sm text-gray-600 mt-1">This may take a few moments</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <p className="font-bold text-gray-700">
                            Drag and drop a photo here, or click to browse
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Supports JPEG and PNG files up to 10MB
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Best results with clear front-facing photos
                          </p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-chart-2 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 mx-auto"
                        >
                          <Camera className="h-5 w-5" />
                          <span>CHOOSE PHOTO</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handleFileSelect(e, child?.id || '')}
                    className="hidden"
                  />

                  {/* Avatar Permissions */}
                  <div className="bg-gray-50 border-2 border-black shadow-brutal p-4">
                    <h4 className="font-bold mb-3">Avatar Permissions</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          defaultChecked={child?.avatar_permissions?.can_customize ?? true}
                          className="mr-2" 
                        />
                        <span className="text-sm font-bold">Allow avatar customization</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          defaultChecked={child?.avatar_permissions?.can_chat ?? true}
                          className="mr-2" 
                        />
                        <span className="text-sm font-bold">Enable avatar chatbot</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">Chat time limit:</span>
                        <select 
                          defaultValue={child?.avatar_permissions?.chat_time_limit_minutes ?? 30}
                          className="border border-black px-2 py-1 text-sm"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                    <button className="mt-3 bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold text-sm">
                      SAVE PERMISSIONS
                    </button>
                  </div>

                  {/* Usage Guidelines */}
                  <div className="bg-yellow-50 border-2 border-yellow-300 p-4">
                    <h4 className="font-bold text-yellow-800 mb-2">📋 Photo Guidelines</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Use clear, well-lit front-facing photos</li>
                      <li>• Avoid sunglasses or face coverings</li>
                      <li>• Single person in the photo works best</li>
                      <li>• Higher resolution photos create better avatars</li>
                    </ul>
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

        {/* Avatar Creator Modal */}
        {showAvatarCreator && avatarCreatorChildId && (
          <AvatarCreatorModal
            isOpen={showAvatarCreator}
            onClose={() => {
              setShowAvatarCreator(false)
              setAvatarCreatorChildId(null)
            }}
            child={children.find(c => c.id === avatarCreatorChildId)!}
            onAvatarSaved={handleAvatarSaved}
          />
        )}
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
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6 max-w-3xl mx-auto">
        <form onSubmit={createChild} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
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
          </div>
          <div className="bg-chart-4 text-white p-4 border-2 border-black shadow-brutal">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold mb-1">Child Access Code</label>
                <div className="text-2xl font-mono font-bold">{newChild.accessCode}</div>
              </div>
              <button type="button" onClick={() => setNewChild(c => ({...c, accessCode: generateAccessCode()}))} className="bg-white text-black px-3 py-1 border-2 border-black shadow-brutal hover:shadow-brutal-lg text-xs font-bold">
                REGENERATE
              </button>
            </div>
            <p className="text-xs mt-2">Give this code to the child for login</p>
          </div>
          <div className="text-right">
            <button disabled={creating} className="bg-chart-1 text-white px-6 py-2 border-2 border-black shadow-brutal font-bold text-sm inline-flex items-center space-x-2 disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}<span>ADD CHILD</span></button>
          </div>
        </form>
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
                    <div className="bg-green-500 text-white px-2 py-1 border border-black inline-block">
                      <span className="text-xs font-bold">🎭 AVATAR</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSelectedChild(child.id)} className="flex-1 bg-chart-2 text-white py-2 px-4 border-2 border-black shadow-brutal font-bold text-sm">VIEW PROFILE</button>
              <button 
                onClick={() => openAvatarCreator(child.id)} 
                className="bg-chart-1 text-white py-2 px-3 border-2 border-black shadow-brutal font-bold text-sm hover:bg-chart-1/90 transition-colors"
                title={child.avatar_url ? 'Replace Avatar' : 'Create Avatar'}
              >
                🎭
              </button>
              <button onClick={() => deleteChild(child.id)} className="bg-red-500 text-white py-2 px-4 border-2 border-black shadow-brutal font-bold text-sm hover:bg-red-600 transition-colors">DELETE</button>
            </div>
          </div>
        ))}
        {!loading && Array.isArray(children) && children.length===0 && (
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

      {/* Avatar Creator Modal */}
      {showAvatarCreator && avatarCreatorChildId && (
        <AvatarCreatorModal
          isOpen={showAvatarCreator}
          onClose={() => {
            setShowAvatarCreator(false)
            setAvatarCreatorChildId(null)
          }}
          child={children.find(c => c.id === avatarCreatorChildId)!}
          onAvatarSaved={handleAvatarSaved}
        />
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
