import { Play, Crown, Gamepad2 } from "lucide-react"

type TabType = "play" | "mystuff" | "freeplay" | "educatormenu"

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="bg-background border-b-4 border-black shadow-brutal">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => onTabChange("play")}
            className={`px-8 py-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg transform ${
              activeTab === "play"
                ? "bg-chart-2 text-white shadow-brutal-lg -rotate-2 scale-105"
                : "bg-main text-main-foreground hover:-rotate-1"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Play className="h-6 w-6" />
              <span>PLAY!</span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange("mystuff")}
            className={`px-8 py-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg transform ${
              activeTab === "mystuff"
                ? "bg-chart-3 text-white shadow-brutal-lg rotate-2 scale-105"
                : "bg-main text-main-foreground hover:rotate-1"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6" />
              <span>MY STUFF</span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange("freeplay")}
            className={`px-8 py-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg transform ${
              activeTab === "freeplay"
                ? "bg-chart-4 text-white shadow-brutal-lg -rotate-1 scale-105"
                : "bg-main text-main-foreground hover:rotate-1"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Gamepad2 className="h-6 w-6" />
              <span>FREE PLAY</span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  )
}
