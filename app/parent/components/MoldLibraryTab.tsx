import { Library, Search, Plus, Star, Filter, Eye, Edit } from "lucide-react"
import { useState } from "react"

export default function MoldLibraryTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<string>("browse")

  const categories = [
    { id: "all", name: "All Templates", count: 124 },
    { id: "memory", name: "Memory Games", count: 32 },
    { id: "attention", name: "Attention Training", count: 28 },
    { id: "emotional", name: "Emotional Regulation", count: 24 },
    { id: "social", name: "Social Skills", count: 20 },
    { id: "motor", name: "Motor Skills", count: 20 }
  ]

  const gameTemplates = [
    {
      id: "1",
      name: "Memory Palace Adventure",
      category: "memory",
      rating: 4.8,
      difficulty: "Medium",
      ageRange: "6-12",
      description: "Help children build memory skills through spatial navigation",
      customizable: true,
      featured: true
    },
    {
      id: "2", 
      name: "Focus Forest",
      category: "attention",
      rating: 4.6,
      difficulty: "Easy",
      ageRange: "5-10",
      description: "Sustained attention training in a peaceful forest setting",
      customizable: true,
      featured: false
    },
    {
      id: "3",
      name: "Emotion Detective",
      category: "emotional",
      rating: 4.9,
      difficulty: "Medium",
      ageRange: "7-14",
      description: "Learn to identify and regulate emotions through mystery solving",
      customizable: true,
      featured: true
    },
    {
      id: "4",
      name: "Social Circle",
      category: "social",
      rating: 4.5,
      difficulty: "Hard",
      ageRange: "8-16",
      description: "Practice social interactions in safe virtual environments",
      customizable: false,
      featured: false
    }
  ]

  const filteredTemplates = selectedCategory === "all" 
    ? gameTemplates 
    : gameTemplates.filter(template => template.category === selectedCategory)

  if (viewMode === "create") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">CREATE NEW GAME TEMPLATE</h1>
            <button
              onClick={() => setViewMode("browse")}
              className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              ← BACK TO LIBRARY
            </button>
          </div>
        </div>

        {/* Template Builder */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div>
                <label className="block font-bold mb-2">Game Name:</label>
                <input type="text" placeholder="Enter game name..." className="w-full border-2 border-black p-3 text-lg" />
              </div>
              <div>
                <label className="block font-bold mb-2">Category:</label>
                <select className="w-full border-2 border-black p-3 text-lg">
                  <option>Memory Games</option>
                  <option>Attention Training</option>
                  <option>Emotional Regulation</option>
                  <option>Social Skills</option>
                  <option>Motor Skills</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-2">Target Age Range:</label>
                <div className="flex space-x-2">
                  <input type="number" placeholder="Min" className="flex-1 border-2 border-black p-3" />
                  <span className="self-center font-bold">to</span>
                  <input type="number" placeholder="Max" className="flex-1 border-2 border-black p-3" />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-2">Difficulty Level:</label>
                <select className="w-full border-2 border-black p-3 text-lg">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Game Mechanics</h2>
              <div>
                <label className="block font-bold mb-2">Primary Objective:</label>
                <textarea placeholder="Describe the main learning goal..." className="w-full border-2 border-black p-3 h-24"></textarea>
              </div>
              <div>
                <label className="block font-bold mb-2">Game Type:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" name="gameType" className="mr-2" />
                    Puzzle/Problem Solving
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="gameType" className="mr-2" />
                    Action/Reaction
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="gameType" className="mr-2" />
                    Story/Adventure
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="gameType" className="mr-2" />
                    Creative/Building
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-2">Customization Options:</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Theme/Visual Style
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Difficulty Scaling
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Time Limits
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Reward System
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="bg-chart-1 text-white px-8 py-4 border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-lg">
              CREATE TEMPLATE
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-3 mb-4">
            MOLD LIBRARY
          </h1>
          <p className="text-lg text-gray-700">
            The creator space for therapeutic game templates
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
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
          <button
            onClick={() => setViewMode("create")}
            className="bg-chart-1 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>CREATE NEW</span>
          </button>
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all">
            {template.featured && (
              <div className="bg-yellow-400 text-black px-3 py-1 text-xs font-bold border-b-2 border-black flex items-center">
                <Star className="h-3 w-3 mr-1" />
                FEATURED
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold flex-1">{template.name}</h3>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{template.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Age Range:</span>
                  <span>{template.ageRange}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Difficulty:</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    template.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    template.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {template.difficulty}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Customizable:</span>
                  <span className={template.customizable ? 'text-green-600' : 'text-gray-500'}>
                    {template.customizable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-chart-3 text-white py-2 px-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm flex items-center justify-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>PREVIEW</span>
                </button>
                <button className="flex-1 bg-chart-2 text-white py-2 px-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm flex items-center justify-center space-x-1">
                  <Edit className="h-4 w-4" />
                  <span>USE</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
