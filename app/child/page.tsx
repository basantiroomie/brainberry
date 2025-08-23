"use client"

import { Brain, Settings, LogOut } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// Import tab components
import PlayTab from "./components/PlayTab"
import MyStuffTab from "./components/MyStuffTab"
import FreePlayTab from "./components/FreePlayTab"
import EducatorMenuTab from "./components/EducatorMenuTab"
import EducatorGate from "./components/EducatorGate"

type TabType = "play" | "mystuff" | "freeplay" | "educatormenu"

export default function ChildDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("play")
  const [educatorGateVisible, setEducatorGateVisible] = useState(false)
  const [educatorGateCounter, setEducatorGateCounter] = useState(0)
  const [childProfile, setChildProfile] = useState<any>(null)

  useEffect(() => {
    // Get child profile from sessionStorage
    const stored = sessionStorage.getItem('childProfile')
    if (stored) {
      setChildProfile(JSON.parse(stored))
    } else {
      // Redirect to login if no child profile found
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('childProfile')
    router.push("/")
  }

  const handleEducatorAccess = () => {
    setEducatorGateVisible(true)
    let counter = 3
    setEducatorGateCounter(counter)
    
    const interval = setInterval(() => {
      counter--
      setEducatorGateCounter(counter)
      if (counter <= 0) {
        clearInterval(interval)
        setActiveTab("educatormenu")
        setEducatorGateVisible(false)
      }
    }, 1000)
  }

  const handleBackToChild = () => {
    setActiveTab("play")
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "play":
        return <PlayTab />
      case "mystuff":
        return <MyStuffTab />
      case "freeplay":
        return <FreePlayTab />
      case "educatormenu":
        return <EducatorMenuTab onBackToChild={handleBackToChild} />
      default:
        return <PlayTab />
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
              {childProfile && (
                <span className="text-sm font-medium text-main">Welcome, {childProfile.name}!</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Tab Navigation - Only show for child tabs */}
              {activeTab !== "educatormenu" && (
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

              {/* Hidden Educator Access Button */}
              <button
                onMouseDown={handleEducatorAccess}
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

      {/* Educator Gate Modal */}
      <EducatorGate isVisible={educatorGateVisible} counter={educatorGateCounter} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  )
}
