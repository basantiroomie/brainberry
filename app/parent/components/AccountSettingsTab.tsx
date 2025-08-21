import { Settings, User, Bell, Shield, Palette, Download, Trash2, Save } from "lucide-react"
import { useState } from "react"

export default function AccountSettingsTab() {
  const [activeSection, setActiveSection] = useState<string>("profile")
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
    achievements: false
  })
  // Controlled select states replacing deprecated <option selected>
  const [reportFrequency, setReportFrequency] = useState("Weekly")
  const [themePref, setThemePref] = useState("Brutal (Default)")
  const [layoutPref, setLayoutPref] = useState("Compact")
  const [languagePref, setLanguagePref] = useState("English")
  const [sessionLength, setSessionLength] = useState("30 minutes")
  const [autosaveFreq, setAutosaveFreq] = useState("Every minute")

  const sections = [
    { id: "profile", name: "Profile", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "privacy", name: "Privacy & Security", icon: Shield },
    { id: "preferences", name: "Preferences", icon: Palette },
    { id: "data", name: "Data Management", icon: Download }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 transform rotate-1 inline-block">
          <h1 className="text-4xl md:text-6xl font-bold text-chart-5 mb-4">
            ACCOUNT SETTINGS
          </h1>
          <p className="text-lg text-gray-700">
            Manage your therapist or parent profile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sidebar Navigation - Expanded */}
        <div className="lg:col-span-2 bg-white border-4 border-black shadow-brutal-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-chart-5">Settings Menu</h2>
          <div className="space-y-3">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-4 p-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-left rounded ${
                    activeSection === section.id
                      ? "bg-chart-5 text-white transform -rotate-1"
                      : "bg-white text-black hover:bg-gray-50 hover:rotate-1"
                  }`}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <span className="text-base">{section.name}</span>
                </button>
              )
            })}
          </div>
          
          {/* Additional Info Section */}
          <div className="mt-8 p-4 bg-gray-50 border-2 border-gray-300 rounded">
            <h3 className="font-bold text-sm text-gray-700 mb-2">Account Status</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>✅ Profile Complete</p>
              <p>✅ Email Verified</p>
              <p>⚠️ 2FA Not Enabled</p>
            </div>
          </div>
        </div>

        {/* Content Area - Adjusted */}
        <div className="lg:col-span-3 bg-white border-4 border-black shadow-brutal-xl p-8">
          {activeSection === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold mb-2">Full Name:</label>
                  <input type="text" defaultValue="Dr. Sarah Johnson" className="w-full border-2 border-black p-3" />
                </div>
                <div>
                  <label className="block font-bold mb-2">Email:</label>
                  <input type="email" defaultValue="sarah@brainberry.com" className="w-full border-2 border-black p-3" />
                </div>
                <div>
                  <label className="block font-bold mb-2">Role:</label>
                  <select className="w-full border-2 border-black p-3">
                    <option>Licensed Therapist</option>
                    <option>Parent</option>
                    <option>Educator</option>
                    <option>Researcher</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2">Phone Number:</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full border-2 border-black p-3" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold mb-2">License/Certification:</label>
                  <input type="text" defaultValue="LCSW #123456" className="w-full border-2 border-black p-3" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold mb-2">Organization:</label>
                  <input type="text" defaultValue="Children's Mental Health Center" className="w-full border-2 border-black p-3" />
                </div>
              </div>
              <button className="bg-chart-5 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Communication</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span>Email notifications</span>
                      <input 
                        type="checkbox" 
                        checked={notifications.email}
                        onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                        className="h-5 w-5" 
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Push notifications</span>
                      <input 
                        type="checkbox" 
                        checked={notifications.push}
                        onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                        className="h-5 w-5" 
                      />
                    </label>
                  </div>
                </div>
                
                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Reports</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span>Weekly progress reports</span>
                      <input 
                        type="checkbox" 
                        checked={notifications.weekly}
                        onChange={(e) => setNotifications({...notifications, weekly: e.target.checked})}
                        className="h-5 w-5" 
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Achievement alerts</span>
                      <input 
                        type="checkbox" 
                        checked={notifications.achievements}
                        onChange={(e) => setNotifications({...notifications, achievements: e.target.checked})}
                        className="h-5 w-5" 
                      />
                    </label>
                  </div>
                </div>

                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Frequency</h3>
                  <div>
                    <label className="block font-bold mb-2">Report frequency:</label>
                    <select className="w-full border-2 border-black p-3" value={reportFrequency} onChange={e=>setReportFrequency(e.target.value)}>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
              <button className="bg-chart-5 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>SAVE PREFERENCES</span>
              </button>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Privacy & Security</h2>
              <div className="space-y-4">
                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold mb-2">Current Password:</label>
                      <input type="password" className="w-full border-2 border-black p-3" />
                    </div>
                    <div>
                      <label className="block font-bold mb-2">New Password:</label>
                      <input type="password" className="w-full border-2 border-black p-3" />
                    </div>
                    <div>
                      <label className="block font-bold mb-2">Confirm New Password:</label>
                      <input type="password" className="w-full border-2 border-black p-3" />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Enable 2FA</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button className="bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
                      ENABLE
                    </button>
                  </div>
                </div>

                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Data Sharing</h3>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span>Allow anonymous usage analytics</span>
                      <input type="checkbox" defaultChecked className="h-5 w-5" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Share aggregated progress data for research</span>
                      <input type="checkbox" className="h-5 w-5" />
                    </label>
                  </div>
                </div>
              </div>
              <button className="bg-chart-5 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>UPDATE SECURITY</span>
              </button>
            </div>
          )}

          {activeSection === "preferences" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Application Preferences</h2>
              <div className="space-y-4">
                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Interface</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold mb-2">Theme:</label>
                      <select className="w-full border-2 border-black p-3" value={themePref} onChange={e=>setThemePref(e.target.value)}>
                        <option value="Brutal (Default)">Brutal (Default)</option>
                        <option value="Professional">Professional</option>
                        <option value="Playful">Playful</option>
                        <option value="Minimal">Minimal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-2">Dashboard Layout:</label>
                      <select className="w-full border-2 border-black p-3" value={layoutPref} onChange={e=>setLayoutPref(e.target.value)}>
                        <option value="Compact">Compact</option>
                        <option value="Spacious">Spacious</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-2">Language:</label>
                      <select className="w-full border-2 border-black p-3" value={languagePref} onChange={e=>setLanguagePref(e.target.value)}>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Default Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold mb-2">Default session length:</label>
                      <select className="w-full border-2 border-black p-3" value={sessionLength} onChange={e=>setSessionLength(e.target.value)}>
                        <option value="15 minutes">15 minutes</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="45 minutes">45 minutes</option>
                        <option value="60 minutes">60 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-2">Auto-save frequency:</label>
                      <select className="w-full border-2 border-black p-3" value={autosaveFreq} onChange={e=>setAutosaveFreq(e.target.value)}>
                        <option value="Every 30 seconds">Every 30 seconds</option>
                        <option value="Every minute">Every minute</option>
                        <option value="Every 5 minutes">Every 5 minutes</option>
                        <option value="Manual only">Manual only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button className="bg-chart-5 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>SAVE PREFERENCES</span>
              </button>
            </div>
          )}

          {activeSection === "data" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Data Management</h2>
              <div className="space-y-4">
                <div className="border-2 border-gray-200 p-4 rounded">
                  <h3 className="font-bold mb-3">Export Data</h3>
                  <p className="text-gray-600 mb-4">Download your account data and child progress reports.</p>
                  <div className="space-y-2">
                    <button className="w-full bg-chart-1 text-white py-3 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center space-x-2">
                      <Download className="h-5 w-5" />
                      <span>EXPORT ALL DATA</span>
                    </button>
                    <button className="w-full bg-chart-2 text-white py-3 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center space-x-2">
                      <Download className="h-5 w-5" />
                      <span>EXPORT PROGRESS REPORTS</span>
                    </button>
                  </div>
                </div>

                <div className="border-2 border-red-200 p-4 rounded bg-red-50">
                  <h3 className="font-bold mb-3 text-red-800">Danger Zone</h3>
                  <p className="text-red-600 mb-4">These actions cannot be undone. Please proceed with caution.</p>
                  <div className="space-y-2">
                    <button className="w-full bg-gray-500 text-white py-3 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold">
                      CLEAR ALL PROGRESS DATA
                    </button>
                    <button className="w-full bg-red-600 text-white py-3 px-4 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center justify-center space-x-2">
                      <Trash2 className="h-5 w-5" />
                      <span>DELETE ACCOUNT</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
