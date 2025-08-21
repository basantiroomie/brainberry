"use client"
import { Library, Search, Plus, Star, Eye, Edit, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import GameMoldBuilder from "./GameMoldBuilder"
import { GameMold } from "@/lib/molds"

interface LocalTemplate extends GameMold {}

export default function MoldLibraryTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<string>("browse")
  const [editingMold, setEditingMold] = useState<LocalTemplate | null>(null)
  const [molds, setMolds] = useState<LocalTemplate[]>([])

  async function refresh() {
    try {
      const token = localStorage.getItem('brainberry_user_token')
      if (!token) return

      const res = await fetch('/api/molds', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMolds(data)
      }
    } catch (error) {
      console.error('Failed to load molds:', error)
    }
  }

  useEffect(() => { refresh() }, [viewMode])

  // Dynamic categories from real data
  const categories = (() => {
    const catCounts: Record<string, number> = {}
    molds.forEach(m => { 
      const cat = m.category || 'other'
      catCounts[cat] = (catCounts[cat] || 0) + 1 
    })
    const entries = Object.entries(catCounts).map(([id, count]) => ({ 
      id, 
      name: id.charAt(0).toUpperCase() + id.slice(1), 
      count 
    }))
    return [{ id: 'all', name: 'All Molds', count: molds.length }, ...entries]
  })()

  const filteredMolds = molds.filter(m => 
    selectedCategory === 'all' ? true : m.category === selectedCategory
  )

  if (viewMode === "create" || viewMode === 'edit') {
    return (
      <GameMoldBuilder 
        onCancel={() => { setEditingMold(null); setViewMode('browse') }} 
        initialData={editingMold || undefined}
        onSaved={() => { setEditingMold(null); setViewMode('browse'); refresh() }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-chart-3 mb-4">
            <span>MOLD LIBRARY</span>
          </h1>
          <p className="text-lg text-gray-700">
            The creator space for therapeutic game templates
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block font-bold mb-2 text-sm">Category:</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)} 
                className="border-2 border-black p-3 font-bold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setViewMode('create')}
              className="bg-chart-2 border-4 border-black px-6 py-3 font-bold hover:bg-chart-1 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Molds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMolds.map(mold => (
          <div key={mold.id} className="bg-white border-4 border-black shadow-brutal-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{mold.name}</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setEditingMold(mold); setViewMode('edit') }}
                    className="bg-chart-1 border-2 border-black p-2 hover:bg-chart-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{mold.primaryObjective}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold bg-gray-100 px-2 py-1 border border-black">
                  {mold.category || 'General'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    {mold.scenes?.length || 0} scenes
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMolds.length === 0 && (
        <div className="bg-gray-100 border-4 border-black shadow-brutal-lg p-12 text-center">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-bold mb-2">No Molds Found</h3>
          <p className="text-gray-600 mb-6">
            {selectedCategory === 'all' 
              ? "You haven't created any game molds yet."
              : `No molds found in the "${selectedCategory}" category.`
            }
          </p>
          <button 
            onClick={() => setViewMode('create')}
            className="bg-chart-2 border-4 border-black px-8 py-4 font-bold hover:bg-chart-1 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Mold</span>
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-100 border-4 border-black shadow-brutal-lg p-6">
        <h3 className="text-xl font-bold mb-4">About Game Molds</h3>
        <p className="text-gray-700">
          Game molds are reusable templates that define the structure, mechanics, and therapeutic goals 
          of educational games. Create custom molds tailored to specific learning objectives and assign 
          them to children for targeted skill development.
        </p>
      </div>
    </div>
  )
}
