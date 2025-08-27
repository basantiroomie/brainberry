import { Palette } from "lucide-react"

interface FreePlayTabProps {
  childProfile?: any
}

export default function FreePlayTab({ childProfile }: FreePlayTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-block transform -rotate-2 mb-4">
          <div className="bg-chart-4 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-4xl transform hover:rotate-1 transition-transform">
             MY STUFF
          </div>
        </div>
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
        
      </div>
    </div>
  )
}
