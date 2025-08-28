"use client"

import { useState, useEffect } from 'react'
import { Search, Eye, Plus } from 'lucide-react'

interface Mold {
  id: string
  name: string
  category: string
  structureType: string
  experienceType: string
  primaryObjective: string
  scenes: any[]
  meta: {
    ageRange: { min: number; max: number }
    difficulty: string
    learnerProfiles: string[]
  }
  version: number
  createdAt?: string
  updatedAt?: string
}

interface MoldLibraryProps {
  onMoldSelect: (mold: Mold | null) => void
}

export function MoldLibrary({ onMoldSelect }: MoldLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState('')
  const [molds, setMolds] = useState<Mold[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMolds()
  }, [])

  const loadMolds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/molds')
      if (response.ok) {
        const data = await response.json()
        setMolds(data)
      }
    } catch (error) {
      console.error('Failed to load molds:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dynamic categories based on actual molds
  const categories = (() => {
    const catCounts: Record<string, number> = {}
    molds.forEach(m => { 
      catCounts[m.category] = (catCounts[m.category] || 0) + 1 
    })
    const entries = Object.entries(catCounts).map(([id, count]) => ({ 
      id, 
      name: id.charAt(0).toUpperCase() + id.slice(1), 
      count 
    }))
    return [
      { id: 'all', name: 'All Categories', count: molds.length }, 
      ...entries
    ]
  })()

  const filteredMolds = molds.filter((mold: Mold) => {
    const matchesCategory = selectedCategory === 'all' || mold.category === selectedCategory
    const matchesSearch = mold.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mold.primaryObjective.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-purple-600 mb-4">
            <span>MOLD LIBRARY</span>
          </h1>
          <p className="text-lg text-gray-700">
            The creator space for therapeutic game templates
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search molds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border-2 border-black w-64 font-bold"
              />
            </div>
            <select className="border-2 border-black p-3 font-bold">
              <option>All Difficulties</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${
                selectedCategory === category.id
                  ? "bg-purple-500 text-white shadow-brutal-lg rotate-1"
                  : "bg-white text-black hover:-rotate-1"
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Your Mold Library */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Mold Library</h2>
          <div className="text-sm text-gray-600">
            {filteredMolds.length} of {molds.length} molds
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading molds...</p>
          </div>
        ) : filteredMolds.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border-2 border-gray-200 rounded">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">No molds created yet</h3>
            <p className="text-gray-600 mb-6">Start building your first therapeutic game mold</p>
            <button
              onClick={() => onMoldSelect(null)}
              className="bg-purple-500 text-white px-6 py-3 border-2 border-black shadow-brutal font-bold hover:shadow-brutal-hover transition-all"
            >
              Create Your First Mold
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMolds.map((mold) => (
              <div key={mold.id} className="border-4 border-black bg-white shadow-brutal-xl p-4 flex flex-col hover:shadow-brutal-hover transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg leading-tight">{mold.name}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 border-2 border-black shadow-brutal">
                    v{mold.version}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3 line-clamp-3 flex-1">
                  {mold.primaryObjective}
                </p>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <span className="bg-blue-100 border border-black px-2 py-1 text-center">
                      {mold.meta?.difficulty || 'Medium'}
                    </span>
                    <span className="bg-green-100 border border-black px-2 py-1 text-center">
                      {mold.structureType}
                    </span>
                    {mold.meta?.ageRange && (
                      <span className="bg-purple-100 border border-black px-2 py-1 text-center col-span-2">
                        Ages {mold.meta.ageRange.min}-{mold.meta.ageRange.max}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>{mold.scenes?.length || 0} scenes</span>
                    <span>•</span>
                    <span>{mold.meta?.learnerProfiles?.join(', ') || 'General'}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onMoldSelect(mold)}
                      className="flex-1 bg-purple-500 text-white px-3 py-2 border-2 border-black shadow-brutal font-bold text-sm hover:shadow-brutal-hover transition-all"
                    >
                      Edit
                    </button>
                    <button className="bg-gray-200 text-black px-3 py-2 border-2 border-black shadow-brutal font-bold text-sm hover:shadow-brutal-hover transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}