'use client'

import React, { useState, useEffect } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { AvatarChatCoordinator } from '@/components/AvatarChatCoordinator'
import { ChildAvatarDisplay } from '@/app/child/components/ChildAvatarDisplay'
import { AvatarStatusIndicator } from '@/components/AvatarStatusIndicator'
import { AvatarUrlValidator } from '@/lib/avatar-url-validator'

export default function TestAvatarPage() {
  const [testAvatarUrl, setTestAvatarUrl] = useState('')
  const [childProfile, setChildProfile] = useState<any>(null)

  // Load a test child profile
  useEffect(() => {
    const loadTestProfile = async () => {
      try {
        // Try to get the first child from the API
        const response = await fetch('/api/children')
        if (response.ok) {
          const children = await response.json()
          if (children && children.length > 0) {
            const firstChild = children[0]
            setChildProfile(firstChild)
            if (firstChild.avatar_url) {
              setTestAvatarUrl(firstChild.avatar_url)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load test profile:', error)
      }
    }

    loadTestProfile()
  }, [])

  const handleTestUrl = () => {
    if (testAvatarUrl) {
      const isValid = AvatarUrlValidator.isValidAvatarUrl(testAvatarUrl)
      const sanitized = AvatarUrlValidator.sanitizeAvatarUrl(testAvatarUrl)
      const pngUrl = AvatarUrlValidator.glbToPngUrl(testAvatarUrl)
      const code = AvatarUrlValidator.extractAvatarCode(testAvatarUrl)
      
      console.log('Avatar URL Test Results:', {
        original: testAvatarUrl,
        isValid,
        sanitized,
        pngUrl,
        code
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Avatar System Test Page</h1>
        
        {/* URL Input and Testing */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Avatar URL Testing</h2>
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={testAvatarUrl}
              onChange={(e) => setTestAvatarUrl(e.target.value)}
              placeholder="Enter Ready Player Me avatar URL (e.g., https://models.readyplayer.me/ABC123.glb)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleTestUrl}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Test URL
            </button>
          </div>
          
          {childProfile && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Current Child Profile:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {childProfile.name}</div>
                <div><strong>Avatar URL:</strong> {childProfile.avatar_url || 'None'}</div>
                <div><strong>Headshot URL:</strong> {childProfile.avatar_headshot_url || 'None'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Display Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Child Avatar Display */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Child Avatar Display</h2>
            <div className="flex items-center justify-center space-x-4">
              <ChildAvatarDisplay
                avatarUrl={testAvatarUrl || childProfile?.avatar_url}
                headshotUrl={childProfile?.avatar_headshot_url}
                childName={childProfile?.name || 'Test Child'}
                size="large"
              />
              <div>
                <p className="text-sm text-gray-600">Profile Picture</p>
                <p className="text-xs text-gray-500">Auto-generated from 3D avatar</p>
              </div>
            </div>
          </div>

          {/* Avatar Status Indicator */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Avatar Status Indicator</h2>
            <div className="space-y-4">
              <AvatarStatusIndicator
                avatarUrl={testAvatarUrl || childProfile?.avatar_url}
                headshotUrl={childProfile?.avatar_headshot_url}
                childName={childProfile?.name || 'Test Child'}
                size="small"
                showText={true}
              />
              <AvatarStatusIndicator
                avatarUrl={testAvatarUrl || childProfile?.avatar_url}
                headshotUrl={childProfile?.avatar_headshot_url}
                childName={childProfile?.name || 'Test Child'}
                size="medium"
                showText={true}
              />
              <AvatarStatusIndicator
                avatarUrl={testAvatarUrl || childProfile?.avatar_url}
                headshotUrl={childProfile?.avatar_headshot_url}
                childName={childProfile?.name || 'Test Child'}
                size="large"
                showText={true}
              />
            </div>
          </div>
        </div>

        {/* 3D Avatar Viewer */}
        {(testAvatarUrl || childProfile?.avatar_url) && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">3D Avatar Viewer</h2>
            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
              <SimpleAvatarViewer
                avatarUrl={testAvatarUrl || childProfile?.avatar_url}
                enableControls={true}
                cameraMode="full"
                onModelLoad={(model) => {
                  console.log('3D Avatar loaded successfully:', model)
                }}
                onModelError={(error) => {
                  console.error('3D Avatar loading error:', error)
                }}
              />
            </div>
          </div>
        )}

        {/* 3D Avatar Chatbot */}
        {(testAvatarUrl || childProfile?.avatar_url) && childProfile && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">🎭 Voice Avatar Chat System</h2>
            <div className="mb-3 text-sm text-gray-600">
              <p><strong>Text Mode:</strong> Gemini 2.0-flash-exp + Gemini TTS (with browser fallback)</p>
              <p><strong>Voice Mode:</strong> Gemini Live 2.5-flash-preview with speech recognition</p>
            </div>
            <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
              <AvatarChatCoordinator 
                avatarUrl={testAvatarUrl || childProfile.avatar_url}
                childId={childProfile.id}
                onBack={() => console.log('Back clicked')}
              />
            </div>
          </div>
        )}

        {/* No Avatar State */}
        {!(testAvatarUrl || childProfile?.avatar_url) && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold mb-4">No Avatar Available</h2>
            <p className="text-gray-600 mb-4">
              Enter a Ready Player Me avatar URL above or create a child profile with an avatar to test the components.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Example URL format:</p>
              <code className="bg-gray-100 px-4 py-2 rounded text-sm">
                https://models.readyplayer.me/ABC123.glb
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}