"use client"
import { Library, Search, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { GameMold } from "@/lib/molds"
import { useMockData } from './MockDataContext'

interface LocalTemplate extends GameMold {}

export default function MoldLibraryTab() {
  const { useMock, dataset } = useMockData()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  // Creation/editing removed: molds are immutable developer-authored templates
  const [molds, setMolds] = useState<LocalTemplate[]>([])

  async function refresh() {
  if (useMock) { setMolds((dataset?.molds||[]) as any); return }
    const res = await fetch('/api/molds')
    if (res.ok) {
      const data = await res.json()
      setMolds(data)
    }
  }

  useEffect(() => { refresh() }, [useMock])

  // Dynamic categories (real data) or derived from mock dataset
  const categories = useMock ? (
    (() => {
      const dsMolds = dataset?.molds || []
      const catCounts: Record<string, number> = {}
  dsMolds.forEach((m:any) => { const cat = m.category || 'other'; catCounts[cat] = (catCounts[cat]||0)+1 })
      const entries = Object.entries(catCounts).map(([id,count]) => ({ id, name: id.charAt(0).toUpperCase()+id.slice(1), count }))
      return [{ id:'all', name:'All Templates', count: dsMolds.length }, ...entries]
    })()
  ) : (
    (() => {
      const catCounts: Record<string, number> = {}
      molds.forEach(m => { catCounts[m.category] = (catCounts[m.category]||0)+1 })
      const entries = Object.entries(catCounts).map(([id,count]) => ({ id, name: id.charAt(0).toUpperCase()+id.slice(1), count }))
      return [{ id:'all', name:'All Molds', count: molds.length }, ...entries]
    })()
  )

  // Showcase only in mock using dataset molds
  const showcase = useMock ? (dataset?.molds || []) : []
  const filteredShowcase = showcase.filter((m:any) => selectedCategory==='all' ? true : m.category === selectedCategory)

  // No create/edit mode anymore

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="flex items-center justify-center space-x-3 text-4xl md:text-6xl font-bold text-chart-3 mb-4">
            <span>MOLD LIBRARY</span>
            {useMock && <span className="text-xs px-2 py-1 bg-yellow-300 border-2 border-black text-black font-bold -rotate-2">MOCK</span>}
          </h1>
          <p className="text-lg text-gray-700">
            The creator space for therapeutic game templates
          </p>
        </div>
      </div>

      {/* Search / Filter Bar (without create) */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search molds..."
                className="pl-10 pr-4 py-3 border-2 border-black w-64"
              />
            </div>
            <select className="border-2 border-black p-3">
              <option>All Difficulties</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="text-xs font-bold px-3 py-2 border-2 border-black bg-yellow-200 shadow-brutal rotate-1">
            Developer-seeded templates (read-only)
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
                  ? "bg-chart-3 text-white shadow-brutal-lg rotate-1"
                  : "bg-white text-black hover:-rotate-1"
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Template Showcase (mock mode only) */}
      {useMock && (
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-xl font-bold mb-4">Template Showcase</h2>
          {filteredShowcase.length === 0 && <p className="text-xs text-gray-600">No templates for this category.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowcase.map((mold:any) => (
              <div key={mold.id} className="border-4 border-black bg-secondary shadow-brutal-xl p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg leading-tight">{mold.name}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-white border-2 border-black shadow-brutal">v{mold.version}</span>
                </div>
                <p className="text-xs text-gray-700 mb-3 line-clamp-3">{mold.primaryObjective}</p>
                <div className="mt-auto space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <span className="bg-white border-2 border-black px-2 py-1 text-center">{mold.meta?.difficulty}</span>
                    <span className="bg-white border-2 border-black px-2 py-1 text-center">{mold.structureType}</span>
                    {mold.meta?.ageRange && <span className="bg-white border-2 border-black px-2 py-1 text-center col-span-2">Ages {mold.meta.ageRange?.min || 3}-{mold.meta.ageRange?.max || 12}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mold Catalog (read-only) */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Game Mold Catalog</h2>
        {molds.length === 0 && (
          <p className="text-sm text-gray-600">No molds loaded. They are seeded by the development team.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {molds.map(mold => (
            <div key={mold.id} className="border-4 border-black bg-secondary shadow-brutal-xl p-4 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg leading-tight">{mold.name}</h3>
                <span className="text-xs font-bold px-2 py-1 bg-white border-2 border-black shadow-brutal">v{mold.version}</span>
              </div>
              <p className="text-xs text-gray-700 mb-3 line-clamp-3">{mold.primaryObjective}</p>
              <div className="mt-auto space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <span className="bg-white border-2 border-black px-2 py-1 text-center">{(mold as any).difficulty || 'Medium'}</span>
                  <span className="bg-white border-2 border-black px-2 py-1 text-center">{mold.structureType}</span>
                  { /* Placeholder age range if present in future meta */ }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
