"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings, FlaskConical } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"
import { useState, useEffect } from "react"
import { MockDataProvider, useMockData } from "./components/MockDataContext"
import DashboardTab from "./components/DashboardTab"
import ChildrenTab from "./components/ChildrenTab"
import AnalyticsTab from "./components/AnalyticsTab"
import AccountSettingsTab from "./components/AccountSettingsTab"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

function EducatorDashboardInner() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { useMock, setUseMock } = useMockData()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
      
      // Bootstrap the educator account
      try {
        await fetch('/api/auth/bootstrap', { method: 'POST' })
      } catch (error) {
        console.error('Bootstrap error:', error)
      }
    }
    
    checkAuth()
  }, [router, supabase])

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  const goToLogin = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tabs = [
    { id: "dashboard", name: "DASHBOARD" },
    { id: "children", name: "CHILDREN" },
    { id: "studio", name: "MOLD STUDIO" },
    { id: "analytics", name: "ANALYTICS" },
    { id: "settings", name: "ACCOUNT SETTINGS" }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />
      case "children":
        return <ChildrenTab />
      case "studio":
        // Render a passive hint; actual navigation happens via onClick on the tab
        return <div className="p-6 text-sm text-gray-600">Open Mold Studio using the tab above.</div>
      case "analytics":
        return <AnalyticsTab />
      case "settings":
        return <AccountSettingsTab />
      default:
        return <DashboardTab />
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b-4 border-black shadow-brutal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BrandLogo />
            </div>
            
            {/* Tabs positioned left of settings/logout */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'studio') {
                        router.push('/educator/mold-studio')
                        return
                      }
                      setActiveTab(tab.id)
                    }}
                    className={`px-4 py-2 transition-all font-bold text-sm transform ${
                      activeTab === tab.id
                        ? "bg-chart-1 text-white border-2 border-black shadow-brutal-lg -rotate-1"
                        : "text-gray-600 hover:text-black hover:underline"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUseMock(!useMock)}
                className={`flex items-center space-x-2 px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold ${useMock ? 'bg-yellow-300 text-black' : 'bg-white text-black'}`}
                title="Toggle global mock data mode"
              >
                <FlaskConical className="h-4 w-4" />
                <span>{useMock ? 'MOCK ON' : 'MOCK OFF'}</span>
              </button>
              <button
                onClick={goToLogin}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold">LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default function EducatorDashboard() {
  return (
    <MockDataProvider>
      <EducatorDashboardInner />
    </MockDataProvider>
  )
}
