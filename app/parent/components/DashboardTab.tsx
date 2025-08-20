import { Users, AlertTriangle, TrendingUp, Calendar } from "lucide-react"

export default function DashboardTab() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-1 mb-4">
            DASHBOARD
          </h1>
          <p className="text-lg text-gray-700">
            Your complete overview at a glance
          </p>
        </div>
      </div>

      {/* Key Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-6 w-6 text-chart-2 mr-3" />
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-chart-2 pl-4 py-2">
              <h3 className="font-bold">Emma completed "Memory Palace"</h3>
              <p className="text-gray-600 text-sm">2 hours ago • Cognitive Skills • Score: 92%</p>
            </div>
            <div className="border-l-4 border-chart-3 pl-4 py-2">
              <h3 className="font-bold">Alex earned "Focus Master" badge</h3>
              <p className="text-gray-600 text-sm">1 day ago • Attention Training • New Achievement</p>
            </div>
            <div className="border-l-4 border-chart-4 pl-4 py-2">
              <h3 className="font-bold">Sarah started "Pattern Detective"</h3>
              <p className="text-gray-600 text-sm">2 days ago • Working Memory • In Progress</p>
            </div>
            <div className="border-l-4 border-chart-1 pl-4 py-2">
              <h3 className="font-bold">Michael finished daily session</h3>
              <p className="text-gray-600 text-sm">3 days ago • Executive Function • 45 minutes</p>
            </div>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-chart-3 mr-3" />
            <h2 className="text-2xl font-bold">Pending Assignments</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded">
              <h3 className="font-bold text-yellow-800">Emma - Impulse Control Game</h3>
              <p className="text-yellow-700 text-sm">Due: Today • Assigned 3 days ago</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded">
              <h3 className="font-bold text-blue-800">Alex - Social Skills Builder</h3>
              <p className="text-blue-700 text-sm">Due: Tomorrow • Assigned 1 week ago</p>
            </div>
            <div className="bg-green-50 border-2 border-green-300 p-3 rounded">
              <h3 className="font-bold text-green-800">Sarah - Working Memory Challenge</h3>
              <p className="text-green-700 text-sm">Due: Friday • Assigned 2 days ago</p>
            </div>
          </div>
          <button className="mt-4 bg-chart-3 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full">
            CREATE NEW ASSIGNMENT
          </button>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <h2 className="text-2xl font-bold">Performance Alerts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-red-50 border-2 border-red-300 p-4 rounded">
            <h3 className="font-bold text-red-800 mb-2">⚠️ Emma - Impulse Control</h3>
            <p className="text-red-700 text-sm mb-3">Showing increased difficulty with self-regulation games. Consider adjusting difficulty or adding support strategies.</p>
            <button className="bg-red-500 text-white px-3 py-1 text-sm font-bold border border-red-600">
              VIEW DETAILS
            </button>
          </div>
          <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded">
            <h3 className="font-bold text-orange-800 mb-2">🕒 Alex - Session Time</h3>
            <p className="text-orange-700 text-sm mb-3">Has been spending less time in therapeutic activities. Last 3 sessions were under 20 minutes.</p>
            <button className="bg-orange-500 text-white px-3 py-1 text-sm font-bold border border-orange-600">
              ADJUST SCHEDULE
            </button>
          </div>
          <div className="bg-green-50 border-2 border-green-300 p-4 rounded">
            <h3 className="font-bold text-green-800 mb-2">🎉 Sarah - Breakthrough</h3>
            <p className="text-green-700 text-sm mb-3">Showing excellent progress in working memory tasks. Ready for next difficulty level!</p>
            <button className="bg-green-500 text-white px-3 py-1 text-sm font-bold border border-green-600">
              LEVEL UP
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-chart-1 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">4</div>
            <div>Active Children</div>
          </div>
          <div className="text-center p-4 bg-chart-2 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">23</div>
            <div>Games This Week</div>
          </div>
          <div className="text-center p-4 bg-chart-3 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">89%</div>
            <div>Average Progress</div>
          </div>
          <div className="text-center p-4 bg-chart-4 text-white border-2 border-black shadow-brutal">
            <div className="text-3xl font-bold mb-2">3</div>
            <div>Alerts Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}
