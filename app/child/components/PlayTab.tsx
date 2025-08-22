import React from "react"

export default function PlayTab() {
  return (
    <div className="space-y-8">
      {/* Today's Quest - Large Featured */}
      <div className="text-center">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-2 mb-4">
            TODAY'S QUEST!
          </h1>
          <div className="bg-chart-2 text-white p-6 border-2 border-black shadow-brutal mb-6">
            <h2 className="text-2xl font-bold mb-2">Memory Palace Adventure</h2>
            <p className="text-lg">Help the knight find the hidden treasures using your amazing memory!</p>
          </div>
          <button className="bg-chart-2 text-white px-12 py-6 border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-3xl transform hover:scale-105">
            PLAY NOW!
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Amazing Progress!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2">5</div>
            <div>Quests Completed</div>
          </div>
          <div className="text-center p-4 bg-chart-3 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2">12</div>
            <div>Stars Earned</div>
          </div>
          <div className="text-center p-4 bg-chart-4 text-white border-2 border-black shadow-brutal">
            <div className="text-4xl font-bold mb-2">3</div>
            <div>New Levels</div>
          </div>
        </div>
      </div>
    </div>
  )
}
