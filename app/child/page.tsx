"use client"

import { Brain, Settings, LogOut } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// Import tab components
import PlayTab from "./components/PlayTab"
import MyStuffTab from "./components/MyStuffTab"
import FreePlayTab from "./components/FreePlayTab"
import ParentMenuTab from "./components/ParentMenuTab"
import ParentGate from "./components/ParentGate"

type TabType = "play" | "mystuff" | "freeplay" | "parentmenu"

interface ChildData {
  id: string
  name: string
  age: number
  diagnosis: string
}

export default function ChildDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("play")
  const [parentGateVisible, setParentGateVisible] = useState(false)
  const [parentGateCounter, setParentGateCounter] = useState(0)
  const [childData, setChildData] = useState<ChildData | null>(null)

  useEffect(() => {
    // Check if child is logged in and get their data
    const token = localStorage.getItem('brainberry_child_token')
    const childDataStr = localStorage.getItem('brainberry_child_data')
    
    if (!token || !childDataStr) {
      // Redirect to login if no valid session
      router.push('/login')
      return
    }

    try {
      const child = JSON.parse(childDataStr) as ChildData
      setChildData(child)
    } catch (error) {
      console.error('Error parsing child data:', error)
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    // Clear child session data
    localStorage.removeItem('brainberry_child_token')
    localStorage.removeItem('brainberry_child_data')
    router.push("/")
  }

  const handleParentAccess = () => {
    setParentGateVisible(true)
    let counter = 3
    setParentGateCounter(counter)
    
    const interval = setInterval(() => {
      counter--
      setParentGateCounter(counter)
      if (counter <= 0) {
        clearInterval(interval)
        setActiveTab("parentmenu")
        setParentGateVisible(false)
      }
    }, 1000)
  }

  const handleBackToChild = () => {
    setActiveTab("play")
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "play":
        return <PlayTab childName={childData?.name} />
      case "mystuff":
        return <MyStuffTab />
      case "freeplay":
        return <FreePlayTab />
      case "parentmenu":
        return <ParentMenuTab onBackToChild={handleBackToChild} />
      default:
        return <PlayTab childName={childData?.name} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BrandLogo variant="child" />
              <span className="text-sm text-gray-500">| Child Zone</span>
              {childData && (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-lg font-bold text-chart-2">
                    Welcome, {childData.name}! 🎮
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Tab Navigation - Only show for child tabs */}
              {activeTab !== "parentmenu" && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab("play")}
                    className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${
                      activeTab === "play"
                        ? "bg-chart-2 text-white shadow-brutal-lg -rotate-1 scale-105"
                        : "bg-main text-main-foreground hover:-rotate-1"
                    }`}
                  >
                    PLAY!
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("mystuff")}
                    className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${
                      activeTab === "mystuff"
                        ? "bg-chart-3 text-white shadow-brutal-lg rotate-1 scale-105"
                        : "bg-main text-main-foreground hover:rotate-1"
                    }`}
                  >
                    MY STUFF
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("freeplay")}
                    className={`px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-sm transform ${
                      activeTab === "freeplay"
                        ? "bg-chart-4 text-white shadow-brutal-lg -rotate-1 scale-105"
                        : "bg-main text-main-foreground hover:rotate-1"
                    }`}
                  >
                    FREE PLAY
                  </button>
                </div>
              )}

              {/* Hidden Parent Access Button */}
              <button
                onMouseDown={handleParentAccess}
                className="w-8 h-8 opacity-20 hover:opacity-50 transition-opacity"
              >
                <Settings className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Parent Gate Modal */}
      <ParentGate isVisible={parentGateVisible} counter={parentGateCounter} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  )
}
