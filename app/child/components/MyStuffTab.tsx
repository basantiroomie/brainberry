import { Crown, Palette, Trophy } from "lucide-react"

export default function MyStuffTab() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AWESOME STUFF!</h1>
        <p className="text-lg text-gray-700">Make everything just the way you like it!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Creator */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-3 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Avatar Creator</h3>
            <p className="text-gray-600 mb-4">Design your character!</p>
            <div className="w-24 h-24 bg-gray-200 border-2 border-black mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🦸</span>
            </div>
            <button className="bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              CUSTOMIZE
            </button>
          </div>
        </div>

        {/* World Theme */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-4 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">World Theme</h3>
            <p className="text-gray-600 mb-4">Change your world!</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm font-bold">🦕 Dinosaur World</div>
              <div className="text-sm text-gray-500">🚀 Space Station (Locked)</div>
              <div className="text-sm text-gray-500">🏰 Medieval Castle (Locked)</div>
            </div>
            <button className="bg-chart-4 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              SWITCH THEME
            </button>
          </div>
        </div>

        {/* Trophy Room */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <div className="bg-chart-2 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trophy Room</h3>
            <p className="text-gray-600 mb-4">Your amazing rewards!</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-2xl">🏆</div>
              <div className="text-2xl">⭐</div>
              <div className="text-2xl">🎖️</div>
              <div className="text-2xl">🥇</div>
              <div className="text-2xl">💎</div>
              <div className="text-gray-300 text-2xl">🔒</div>
            </div>
            <button className="bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              VIEW ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
