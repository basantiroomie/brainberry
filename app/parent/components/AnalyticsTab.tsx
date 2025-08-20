import { BarChart3, TrendingUp, Calendar, Download, Filter, Users } from "lucide-react"
import { useState } from "react"

export default function AnalyticsTab() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("week")
  const [selectedChild, setSelectedChild] = useState<string>("all")

  const children = [
    { id: "all", name: "All Children" },
    { id: "1", name: "Emma" },
    { id: "2", name: "Alex" },
    { id: "3", name: "Sarah" },
    { id: "4", name: "Michael" }
  ]

  const timeframes = [
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "quarter", name: "This Quarter" },
    { id: "year", name: "This Year" }
  ]

  const progressData = [
    { skill: "Memory", current: 85, previous: 78, trend: "up" },
    { skill: "Attention", current: 92, previous: 89, trend: "up" },
    { skill: "Emotional Regulation", current: 76, previous: 82, trend: "down" },
    { skill: "Social Skills", current: 88, previous: 85, trend: "up" },
    { skill: "Motor Skills", current: 79, previous: 75, trend: "up" }
  ]

  const engagementData = [
    { day: "Mon", sessions: 3, time: 45 },
    { day: "Tue", sessions: 2, time: 30 },
    { day: "Wed", sessions: 4, time: 60 },
    { day: "Thu", sessions: 3, time: 45 },
    { day: "Fri", sessions: 2, time: 30 },
    { day: "Sat", sessions: 5, time: 75 },
    { day: "Sun", sessions: 3, time: 45 }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform -rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-4 mb-4">
            ANALYTICS
          </h1>
          <p className="text-lg text-gray-700">
            Powerful reporting for tracking long-term trends
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block font-bold mb-2 text-sm">Child:</label>
              <select 
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="border-2 border-black p-3 font-bold"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-2 text-sm">Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border-2 border-black p-3 font-bold"
              >
                {timeframes.map((timeframe) => (
                  <option key={timeframe.id} value={timeframe.id}>{timeframe.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="bg-chart-4 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-1 mb-2">127</div>
          <div className="text-sm font-bold text-gray-600">TOTAL SESSIONS</div>
          <div className="text-green-600 text-xs mt-1 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            +15% vs last period
          </div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-2 mb-2">42h</div>
          <div className="text-sm font-bold text-gray-600">TOTAL TIME</div>
          <div className="text-green-600 text-xs mt-1 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            +8% vs last period
          </div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-3 mb-2">84%</div>
          <div className="text-sm font-bold text-gray-600">AVG COMPLETION</div>
          <div className="text-green-600 text-xs mt-1 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            +3% vs last period
          </div>
        </div>
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 text-center">
          <div className="text-3xl font-bold text-chart-4 mb-2">91%</div>
          <div className="text-sm font-bold text-gray-600">ENGAGEMENT RATE</div>
          <div className="text-green-600 text-xs mt-1 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            +5% vs last period
          </div>
        </div>
      </div>

      {/* Progress by Skill Area */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Progress by Skill Area</h2>
        <div className="space-y-4">
          {progressData.map((skill, index) => (
            <div key={index} className="border-2 border-gray-200 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{skill.skill}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">{skill.current}%</span>
                  <div className={`flex items-center text-sm ${
                    skill.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-4 w-4 mr-1 ${
                      skill.trend === 'down' ? 'rotate-180' : ''
                    }`} />
                    <span>{skill.trend === 'up' ? '+' : ''}{skill.current - skill.previous}%</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-chart-2 h-3 rounded-full transition-all duration-500"
                  style={{width: `${skill.current}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Engagement */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Weekly Engagement</h2>
        <div className="grid grid-cols-7 gap-2">
          {engagementData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="font-bold text-sm mb-2">{day.day}</div>
              <div className="bg-chart-1 border-2 border-black p-3 mb-2">
                <div className="text-white font-bold text-lg">{day.sessions}</div>
                <div className="text-white text-xs">Sessions</div>
              </div>
              <div className="bg-chart-3 border-2 border-black p-3">
                <div className="text-white font-bold text-lg">{day.time}</div>
                <div className="text-white text-xs">Minutes</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4">🏆 Top Performing Games</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200">
              <span className="font-bold">Memory Palace Adventure</span>
              <span className="text-chart-2 font-bold">94%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200">
              <span className="font-bold">Focus Forest</span>
              <span className="text-chart-2 font-bold">89%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200">
              <span className="font-bold">Emotion Detective</span>
              <span className="text-chart-2 font-bold">87%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h3 className="text-xl font-bold mb-4">📊 Areas for Improvement</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded">
              <div className="font-bold text-red-800">Emotional Regulation</div>
              <div className="text-sm text-red-600">6% decrease this week - consider additional support</div>
            </div>
            <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded">
              <div className="font-bold text-yellow-800">Session Consistency</div>
              <div className="text-sm text-yellow-600">Gaps between sessions - encourage daily practice</div>
            </div>
            <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded">
              <div className="font-bold text-blue-800">Motor Skills</div>
              <div className="text-sm text-blue-600">Steady progress - maintain current approach</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
