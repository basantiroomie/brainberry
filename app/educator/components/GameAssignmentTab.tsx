"use client"
import { Users, Play, Plus, Trash2, Search, Filter, CheckCircle2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from 'sonner'
import { useMockData } from './MockDataContext'

interface Child {
  id: string
  name: string
  age: number
  diagnosis: string
  access_code?: string
}

interface GameMold {
  id: string
  name: string
  category: string
  difficulty: string
  primaryObjective: string
  meta?: any
}

interface Assignment {
  id: string
  childId: string
  moldId: string
  progress: number
  status: string
  mold: GameMold
}

export default function GameAssignmentTab() {
  const [children, setChildren] = useState<Child[]>([])
  const [games, setGames] = useState<GameMold[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [assigning, setAssigning] = useState<string>("")

  const { useMock, dataset, addAssignment } = useMockData()

  useEffect(() => {
    loadData()
  }, [useMock, dataset])

  async function loadData() {
    setLoading(true)
    console.log('Loading data - useMock:', useMock, 'dataset available:', !!dataset)
    
    try {
      if (useMock) {
        // Use mock data
        const children = dataset?.children || []
        const molds = dataset?.molds || []
        const assignments = dataset?.assignments || []
        
        console.log('Mock data counts - children:', children.length, 'molds:', molds.length, 'assignments:', assignments.length)
        
        setChildren(children as Child[])
        
        // Transform mock molds to match GameMold interface
        const transformedMolds = molds.map(mold => ({
          id: mold.id,
          name: mold.name,
          category: mold.structureType || 'General',
          difficulty: mold.meta?.difficulty || 'Easy',
          primaryObjective: mold.primaryObjective,
          meta: mold.meta
        })) as GameMold[]
        setGames(transformedMolds)
        
        // Create assignments with mold data attached
        const mockAssignments = assignments.map(a => {
          const mold = molds.find(m => m.id === a.moldId)
          return {
            ...a,
            mold: mold ? {
              id: mold.id,
              name: mold.name,
              category: mold.structureType || 'General',
              difficulty: mold.meta?.difficulty || 'Easy',
              primaryObjective: mold.primaryObjective,
              meta: mold.meta
            } : { 
              id: a.moldId, 
              name: 'Unknown Game', 
              category: 'Unknown', 
              difficulty: 'Easy', 
              primaryObjective: 'Unknown objective' 
            }
          }
        }) as Assignment[]
        setAssignments(mockAssignments)
      } else {
        // Load real data (match ChildrenTab approach)
        console.log('Loading real data from APIs...')
        
        // Load children
        console.log('Fetching children...')
        const childrenRes = await fetch('/api/children')
        if (childrenRes.ok) {
          const childrenData = await childrenRes.json()
          console.log('Children loaded:', childrenData.length, 'items')
          setChildren(childrenData)
        } else {
          console.error('Failed to fetch children:', childrenRes.status)
          toast.error('Failed to load children')
        }

        // Load games/molds
        console.log('Fetching molds...')
        const gamesRes = await fetch('/api/molds')
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json()
          console.log('Molds loaded:', gamesData.length, 'items')
          // Transform API molds to match GameMold interface
          const transformedMolds = gamesData.map((mold: any) => ({
            id: mold.id,
            name: mold.name,
            category: mold.structureType || 'General',
            difficulty: mold.meta?.difficulty || 'Easy',
            primaryObjective: mold.primaryObjective,
            meta: mold.meta
          })) as GameMold[]
          setGames(transformedMolds)
        } else {
          console.error('Failed to fetch games:', gamesRes.status)
          toast.error('Failed to load games')
        }

        // Load all assignments
        console.log('Fetching assignments...')
        const assignmentsRes = await fetch('/api/assignments')
        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          console.log('Assignments loaded:', assignmentsData.length, 'items')
          // Transform API assignments to match Assignment interface
          const transformedAssignments = assignmentsData.map((a: any) => ({
            id: a.id,
            childId: a.child_id,
            moldId: a.mold_id,
            progress: a.progress || 0,
            status: a.status || 'assigned',
            mold: a.mold ? {
              id: a.mold.id,
              name: a.mold.name,
              category: a.mold.structureType || 'General',
              difficulty: a.mold.meta?.difficulty || 'Easy',
              primaryObjective: a.mold.primaryObjective,
              meta: a.mold.meta
            } : {
              id: a.mold_id,
              name: 'Unknown Game',
              category: 'Unknown',
              difficulty: 'Easy',
              primaryObjective: 'Unknown objective'
            }
          })) as Assignment[]
          setAssignments(transformedAssignments)
        } else {
          console.error('Failed to fetch assignments:', assignmentsRes.status)
          toast.error('Failed to load assignments')
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load assignment data')
    } finally {
      setLoading(false)
    }
  }

  async function assignGame(childId: string, moldId: string) {
    const assignKey = `${childId}-${moldId}`
    setAssigning(assignKey)
    
    try {
      if (useMock) {
        // Mock assignment
        addAssignment(childId, moldId)
        await loadData() // Refresh to show the new assignment
        toast.success('Game assigned successfully (mock)')
      } else {
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ child_id: childId, mold_id: moldId })
        })

        if (response.ok) {
          await loadData() // Refresh data
          toast.success('Game assigned successfully')
        } else {
          const errorData = await response.text()
          console.error('Failed to assign game:', response.status, errorData)
          toast.error('Failed to assign game')
        }
      }
    } catch (error) {
      console.error('Failed to assign game:', error)
      toast.error('Error assigning game')
    } finally {
      setAssigning("")
    }
  }

  async function removeAssignment(assignmentId: string) {
    try {
      if (useMock) {
        // Mock removal - filter out the assignment
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId)
        setAssignments(updatedAssignments)
        toast.success('Assignment removed (mock)')
      } else {
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadData() // Refresh data
          toast.success('Assignment removed successfully')
        } else {
          const errorData = await response.text()
          console.error('Failed to remove assignment:', response.status, errorData)
          toast.error('Failed to remove assignment')
        }
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error)
      toast.error('Error removing assignment')
    }
  }

  function isGameAssigned(childId: string, moldId: string): Assignment | undefined {
    return assignments.find(a => a.childId === childId && a.moldId === moldId)
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.primaryObjective.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(games.map(g => g.category)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-chart-1" />
          <div className="text-xl font-bold">Loading game assignments...</div>
        </div>
      </div>
    )
  }

  // Debug info
  console.log('Render - Children count:', children.length, 'Games count:', games.length, 'Assignments count:', assignments.length)

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block">
          <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-chart-2 mb-4">
            <Users className="w-12 h-12" />
            <span>GAME ASSIGNMENTS</span>
          </h1>
          <p className="text-lg text-gray-700">
            Assign and manage therapeutic games for each child
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-black w-64 font-bold"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-2 border-black p-2 font-bold"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm font-bold text-gray-600">
            {children.length} Children • {filteredGames.length} Games Available
          </div>
        </div>
      </div>

      {/* Assignment Matrix */}
      <div className="bg-white border-4 border-black shadow-brutal-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                <th className="px-6 py-4 text-left font-bold border-r-2 border-black min-w-[200px]">
                  THERAPEUTIC GAME
                </th>
                {children.map(child => (
                  <th key={child.id} className="px-4 py-4 text-center font-bold border-r-2 border-black min-w-[120px]">
                    <div className="space-y-1">
                      <div className="font-bold">{child.name}</div>
                      <div className="text-xs text-gray-600">Age: {child.age}</div>
                      <div className="text-xs text-gray-500">{child.diagnosis}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={children.length + 1} className="px-6 py-8 text-center text-gray-500 font-bold">
                    {searchTerm || selectedCategory !== 'all' ? 'No games match your search criteria' : 'No games available'}
                  </td>
                </tr>
              ) : (
                filteredGames.map(game => (
                  <tr key={game.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 border-r-2 border-gray-200">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">{game.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 border font-bold ${getDifficultyColor(game.difficulty)}`}>
                            {game.difficulty}
                          </span>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 border border-gray-300 font-bold">
                            {game.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{game.primaryObjective}</p>
                        <div className="text-xs text-gray-500">
                          Therapeutic Focus: {game.meta?.therapeuticFocus || 'General Development'}
                        </div>
                      </div>
                    </td>
                    {children.map(child => {
                      const assignment = isGameAssigned(child.id, game.id)
                      const assignKey = `${child.id}-${game.id}`
                      const isCurrentlyAssigning = assigning === assignKey
                      
                      return (
                        <td key={child.id} className="px-4 py-4 text-center border-r-2 border-gray-200">
                          {assignment ? (
                            <div className="space-y-2">
                              <div className="bg-green-100 border-2 border-green-300 rounded p-2">
                                <div className="font-bold text-green-800 flex items-center justify-center space-x-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>ASSIGNED</span>
                                </div>
                                <div className="text-sm text-green-600">{assignment.progress}% complete</div>
                                <div className="bg-green-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all" 
                                    style={{ width: `${assignment.progress}%` }}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => removeAssignment(assignment.id)}
                                className="bg-red-500 text-white p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-xs"
                                title="Remove Assignment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => assignGame(child.id, game.id)}
                              disabled={isCurrentlyAssigning}
                              className="bg-chart-2 text-white p-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Assign Game"
                            >
                              {isCurrentlyAssigning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-1 mb-2">{children.length}</div>
          <div className="text-sm font-bold text-gray-600">CHILDREN</div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-2 mb-2">{games.length}</div>
          <div className="text-sm font-bold text-gray-600">AVAILABLE GAMES</div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-3 mb-2">{assignments.length}</div>
          <div className="text-sm font-bold text-gray-600">ACTIVE ASSIGNMENTS</div>
        </div>
      </div>
    </div>
  )
}
