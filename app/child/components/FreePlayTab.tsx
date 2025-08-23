import { Palette } from "lucide-react"

export default function FreePlayTab() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-chart-4 mb-2">FREE PLAY TIME!</h1>
        <p className="text-lg text-gray-700">Choose any game you want to play!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calming Canvas */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Calming Canvas</h3>
            <p className="text-gray-600 mb-4">Draw and create beautiful art</p>
            <button className="bg-blue-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              DRAW
            </button>
          </div>
        </div>

        {/* Music Maker */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎵</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Music Maker</h3>
            <p className="text-gray-600 mb-4">Create your own songs</p>
            <button className="bg-purple-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              PLAY MUSIC
            </button>
          </div>
        </div>

        {/* Breathing Buddy */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🫁</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Breathing Buddy</h3>
            <p className="text-gray-600 mb-4">Relax and breathe together</p>
            <button className="bg-green-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              BREATHE
            </button>
          </div>
        </div>

        {/* Shape Sorter */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔷</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Shape Sorter</h3>
            <p className="text-gray-600 mb-4">Fun with shapes and colors</p>
            <button className="bg-orange-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              SORT
            </button>
          </div>
        </div>

        {/* Story Builder */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📖</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Story Builder</h3>
            <p className="text-gray-600 mb-4">Create amazing stories</p>
            <button className="bg-pink-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              CREATE
            </button>
          </div>
        </div>

        {/* Puzzle Time */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 hover:shadow-brutal-2xl transition-all">
          <div className="text-center">
            <div className="bg-teal-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧩</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Puzzle Time</h3>
            <p className="text-gray-600 mb-4">Solve fun puzzles</p>
            <button className="bg-teal-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
              SOLVE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
