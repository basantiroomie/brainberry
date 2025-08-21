"use client"
import { Users, Play, Plus, Trash2, Search, Filter } from "lucide-react"
import { useState, useEffect } from "react"

interface Child {
  id: string
  name: string
  age: number
  diagnosis: string
  accessCode: string
}

interface GameMold {
  id: string
  name: string
  category: string
  difficulty: string
  primaryObjective: string
  scenes: Array<{ id: string; title: string }>
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

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      // Load children
      const childrenRes = await fetch('/api/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json()
        setChildren(childrenData)
      }

      // Load games
      const gamesRes = await fetch('/api/molds', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json()
        setGames(gamesData)
      }

      // Load all assignments
      const assignmentsRes = await fetch('/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      }

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function assignGame(childId: string, moldId: string) {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ childId, moldId })
      })

      if (response.ok) {
        loadData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to assign game:', error)
    }
  }

  async function removeAssignment(assignmentId: string) {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        loadData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error)
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
        <div className="text-xl">Loading game assignments...</div>
      </div>
    )
  }

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
            Assign and manage games for each child
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
                className="pl-10 pr-4 py-2 border-2 border-black w-64"
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
            {children.length} Children • {filteredGames.length} Games
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
                  Game
                </th>
                {children.map(child => (
                  <th key={child.id} className="px-4 py-4 text-center font-bold border-r-2 border-black min-w-[120px]">
                    <div className="space-y-1">
                      <div className="font-bold">{child.name}</div>
                      <div className="text-xs text-gray-600">Code: {child.accessCode}</div>
                      <div className="text-xs text-gray-500">{child.diagnosis}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGames.map(game => (
                <tr key={game.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 border-r-2 border-gray-200">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{game.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 border font-bold ${getDifficultyColor(game.difficulty)}`}>
                          {game.difficulty}
                        </span>
                        <span className="text-sm text-gray-600">{game.category}</span>
                      </div>
                      <p className="text-sm text-gray-700">{game.primaryObjective}</p>
                      <div className="text-xs text-gray-500">
                        {game.scenes.length} scenes
                      </div>
                    </div>
                  </td>
                  {children.map(child => {
                    const assignment = isGameAssigned(child.id, game.id)
                    return (
                      <td key={child.id} className="px-4 py-4 text-center border-r-2 border-gray-200">
                        {assignment ? (
                          <div className="space-y-2">
                            <div className="bg-green-100 border-2 border-green-300 rounded p-2">
                              <div className="font-bold text-green-800">ASSIGNED</div>
                              <div className="text-sm text-green-600">{assignment.progress}% complete</div>
                            </div>
                            <button
                              onClick={() => removeAssignment(assignment.id)}
                              className="bg-red-500 text-white p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
                              title="Remove Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => assignGame(child.id, game.id)}
                            className="bg-chart-2 text-white p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
                            title="Assign Game"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-100 border-4 border-black shadow-brutal-xl p-6">
        <h3 className="text-xl font-bold mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6 bg-chart-2 text-white p-1 border border-black" />
            <span>Click to assign game to child</span>
          </div>
          <div className="flex items-center space-x-3">
            <Trash2 className="w-6 h-6 bg-red-500 text-white p-1 border border-black" />
            <span>Click to remove assignment</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 border border-green-300 px-2 py-1 text-xs font-bold text-green-800">ASSIGNED</div>
            <span>Game is currently assigned to child</span>
          </div>
          <div className="flex items-center space-x-3">
            <Search className="w-6 h-6 text-gray-600" />
            <span>Search games by name or objective</span>
          </div>
        </div>
      </div>
    </div>
  )
}
