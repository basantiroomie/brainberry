'use client'

import React, { useState } from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'

// Test component to debug avatar loading issues
export default function TestAvatarViewer() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testUrls = [
    {
      name: 'Known Working Avatar 1',
      url: 'https://models.readyplayer.me/68ad29be1b10d8c48a4e516d.glb'
    },
    {
      name: 'Known Working Avatar 2', 
      url: 'https://models.readyplayer.me/68ad2b510eaecb799cc498e5.glb'
    },
    {
      name: 'Invalid URL Test',
      url: 'invalid-url'
    },
    {
      name: 'Non-existent GLB',
      url: 'https://models.readyplayer.me/nonexistent.glb'
    },
    {
      name: 'Null URL Test',
      url: null
    }
  ]

  const handleModelLoad = (model: any, testName: string) => {
    addLog(`✅ ${testName}: Model loaded successfully`)
    console.log(`Test: Model loaded successfully for ${testName}:`, model)
  }

  const handleModelError = (error: any, testName: string) => {
    addLog(`❌ ${testName}: ${error?.message || error || 'Unknown error'}`)
    console.error(`Test: Model loading error for ${testName}:`, error)
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Avatar Viewer Debug Test</h1>
        <p className="text-gray-600">Testing avatar loading with various URLs to debug GLB loading issues</p>
      </div>
      
      {/* Logs Panel */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
        <h3 className="text-white font-bold mb-2">Debug Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet...</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testUrls.map((test, index) => (
          <div key={index} className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg">
            <h3 className="font-bold mb-2 text-center">{test.name}</h3>
            <p className="text-xs text-gray-500 mb-4 break-all">{test.url || 'null'}</p>
            <div className="w-full h-64 border border-gray-200 rounded bg-gray-50">
              {test.url ? (
                <AvatarViewer
                  avatarUrl={test.url}
                  enableControls={true}
                  cameraMode="headshot"
                  onModelLoad={(model) => handleModelLoad(model, test.name)}
              onModelError={(error) => handleModelError(error, test.name)}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p>Null URL Test</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">Instructions:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Open browser dev tools (F12) to see detailed console logs</li>
          <li>• Check the Debug Logs panel above for real-time status updates</li>
          <li>• Working avatars should load 3D models you can rotate with mouse</li>
          <li>• Invalid URLs should show appropriate error messages instead of empty objects</li>
          <li>• Network tab in dev tools will show if GLB files are being fetched</li>
        </ul>
      </div>
    </div>
  )
}