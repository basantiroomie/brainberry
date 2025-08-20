import { Users, User, Plus, BarChart3, Settings, Palette } from "lucide-react"
import { useState } from "react"

export default function ChildrenTab() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [childSubTab, setChildSubTab] = useState<string>("overview")

  const children = [
    { id: "1", name: "Emma", age: 8, status: "Active", progress: 85, lastActive: "Today, 2:30 PM" },
    { id: "2", name: "Alex", age: 10, status: "Active", progress: 92, lastActive: "Yesterday, 4:15 PM" },
    { id: "3", name: "Sarah", age: 7, status: "Active", progress: 78, lastActive: "2 days ago, 1:20 PM" },
    { id: "4", name: "Michael", age: 9, status: "Inactive", progress: 65, lastActive: "1 week ago" }
  ]

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
                <p className="text-gray-600">Last active: {child?.lastActive}</p>
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
            {["overview", "progress", "customize", "settings"].map((tab) => (
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
                <div className="border-2 border-gray-300 p-4 rounded">
                  <h3 className="font-bold mb-2">🎯 Current Goal: Impulse Control</h3>
                  <p className="text-gray-600 mb-2">Working on self-regulation through interactive games</p>
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-chart-2 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                  <span className="text-sm text-gray-500">60% Complete</span>
                </div>
                <div className="border-2 border-gray-300 p-4 rounded">
                  <h3 className="font-bold mb-2">🧠 Assigned Game: Memory Palace</h3>
                  <p className="text-gray-600 mb-2">Adventure-based memory training</p>
                  <button className="bg-chart-2 text-white px-4 py-2 border border-black font-bold text-sm">
                    VIEW GAME
                  </button>
                </div>
              </div>
            </div>
          )}

          {childSubTab === "progress" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Detailed Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-chart-2 text-white border-2 border-black">
                  <div className="text-2xl font-bold">85%</div>
                  <div>Overall Progress</div>
                </div>
                <div className="text-center p-4 bg-chart-3 text-white border-2 border-black">
                  <div className="text-2xl font-bold">12</div>
                  <div>Games Completed</div>
                </div>
                <div className="text-center p-4 bg-chart-4 text-white border-2 border-black">
                  <div className="text-2xl font-bold">45min</div>
                  <div>Avg Session Time</div>
                </div>
              </div>
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
      <div className="text-center mb-6">
        <button className="bg-chart-1 text-white px-8 py-4 border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-lg flex items-center space-x-3 mx-auto">
          <Plus className="h-6 w-6" />
          <span>ADD NEW CHILD</span>
        </button>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child) => (
          <div key={child.id} className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`text-white rounded-full w-16 h-16 flex items-center justify-center ${
                child.status === 'Active' ? 'bg-chart-2' : 'bg-gray-400'
              }`}>
                <User className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{child.name} (Age {child.age})</h3>
                <p className="text-gray-600 text-sm">Last active: {child.lastActive}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`px-2 py-1 text-xs font-bold rounded ${
                    child.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {child.status}
                  </div>
                  <div className="text-sm font-bold text-chart-2">{child.progress}% Progress</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedChild(child.id)}
              className="w-full bg-chart-2 text-white py-2 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              VIEW PROFILE
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
