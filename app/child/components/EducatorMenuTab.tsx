interface EducatorMenuTabProps {
  onBackToChild: () => void
}

export default function EducatorMenuTab({ onBackToChild }: EducatorMenuTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-700 mb-2">EDUCATOR CONTROLS</h1>
        <p className="text-lg text-gray-600">Quick access to important settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Limits */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            Daily Time Limits
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Today's Quest:</span>
              <select className="border-2 border-black p-2">
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span>Free Play:</span>
              <select className="border-2 border-black p-2">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>45 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🔊</span>
            Sound Settings
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Master Volume:</span>
              <input type="range" min="0" max="100" defaultValue="75" className="w-24" />
            </div>
            <div className="flex justify-between items-center">
              <span>Background Music:</span>
              <input type="checkbox" defaultChecked className="scale-150" />
            </div>
            <div className="flex justify-between items-center">
              <span>Sound Effects:</span>
              <input type="checkbox" defaultChecked className="scale-150" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 text-white py-2 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold">
              VIEW PROGRESS REPORT
            </button>
            <button className="w-full bg-green-500 text-white py-2 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold">
              ASSIGN NEW QUEST
            </button>
            <button className="w-full bg-orange-500 text-white py-2 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold">
              CONTACT THERAPIST
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Today's Session
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Time Played:</span>
              <span className="font-bold">23 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Games Completed:</span>
              <span className="font-bold">2</span>
            </div>
            <div className="flex justify-between">
              <span>Stars Earned:</span>
              <span className="font-bold">5 ⭐</span>
            </div>
            <div className="flex justify-between">
              <span>Mood Rating:</span>
              <span className="font-bold">😊 Happy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onBackToChild}
          className="bg-chart-2 text-white px-8 py-3 border-4 border-black shadow-brutal-xl hover:shadow-brutal-2xl transition-all font-bold text-lg"
        >
          BACK TO CHILD VIEW
        </button>
      </div>
    </div>
  )
}
