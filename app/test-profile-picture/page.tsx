'use client'

import React, { useState } from 'react'
import ProfilePicture from '@/components/ProfilePicture'
import ChildAvatarDisplay from '@/app/child/components/ChildAvatarDisplay'
import { ProfilePictureUtils, AvatarCodeUtils } from '@/lib/avatar-utils'

export default function TestProfilePicturePage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Test avatar URLs (using known Ready Player Me format)
  const testAvatars = [
    {
      name: 'Test Avatar 1',
      glbUrl: 'https://models.readyplayer.me/ABCD12.glb',
      pngUrl: 'https://models.readyplayer.me/ABCD12.png'
    },
    {
      name: 'Test Avatar 2', 
      glbUrl: 'https://models.readyplayer.me/XYZ789.glb',
      pngUrl: 'https://models.readyplayer.me/XYZ789.png'
    }
  ]

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAvatarCodeUtils = async () => {
    setIsLoading(true)
    addTestResult('Testing AvatarCodeUtils...')
    
    try {
      // Test code validation
      const validCode = 'ABCD12'
      const invalidCode = 'invalid'
      
      addTestResult(`Valid code test: ${AvatarCodeUtils.validateAvatarCode(validCode)} (should be true)`)
      addTestResult(`Invalid code test: ${AvatarCodeUtils.validateAvatarCode(invalidCode)} (should be false)`)
      
      // Test URL conversion
      const urls = AvatarCodeUtils.codeToUrls(validCode)
      addTestResult(`GLB URL: ${urls.glbUrl}`)
      addTestResult(`PNG URL: ${urls.pngUrl}`)
      
      // Test URL extraction
      const extractedCode = AvatarCodeUtils.extractCodeFromGlbUrl(urls.glbUrl)
      addTestResult(`Extracted code: ${extractedCode} (should be ${validCode})`)
      
    } catch (error) {
      addTestResult(`Error: ${error instanceof Error ? error.message : error}`)
    }
    
    setIsLoading(false)
  }

  const testPngAccessibility = async () => {
    setIsLoading(true)
    addTestResult('Testing PNG URL accessibility...')
    
    for (const avatar of testAvatars) {
      try {
        const isAccessible = await ProfilePictureUtils.testPngUrlAccessibility(avatar.pngUrl)
        addTestResult(`${avatar.name} PNG accessible: ${isAccessible}`)
      } catch (error) {
        addTestResult(`${avatar.name} PNG test error: ${error instanceof Error ? error.message : error}`)
      }
    }
    
    setIsLoading(false)
  }

  const testProfileGeneration = async () => {
    setIsLoading(true)
    addTestResult('Testing profile picture generation...')
    
    for (const avatar of testAvatars) {
      try {
        const profilePicture = await ProfilePictureUtils.generateProfilePictureWithFallback(avatar.glbUrl, 64)
        if (profilePicture) {
          addTestResult(`${avatar.name} profile generated successfully (${profilePicture.length} chars)`)
        } else {
          addTestResult(`${avatar.name} profile generation failed`)
        }
      } catch (error) {
        addTestResult(`${avatar.name} generation error: ${error instanceof Error ? error.message : error}`)
      }
    }
    
    setIsLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Picture System Test</h1>
        
        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={testAvatarCodeUtils}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Avatar Code Utils
            </button>
            <button
              onClick={testPngAccessibility}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test PNG Accessibility
            </button>
            <button
              onClick={testProfileGeneration}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Profile Generation
            </button>
            <button
              onClick={clearResults}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Clear Results
            </button>
          </div>
          
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Running tests...</span>
            </div>
          )}
        </div>

        {/* Visual Tests */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Visual Component Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ProfilePicture Component Tests */}
            <div className="space-y-4">
              <h3 className="font-semibold">ProfilePicture Component</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ProfilePicture
                    name="Test Child 1"
                    size="sm"
                    avatarUrl="https://models.readyplayer.me/ABCD12.glb"
                    autoGenerate={true}
                  />
                  <span className="text-sm">Small (with GLB URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture
                    name="Test Child 2"
                    size="md"
                    avatarUrl="https://models.readyplayer.me/XYZ789.glb"
                    autoGenerate={true}
                  />
                  <span className="text-sm">Medium (with GLB URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture
                    name="Test Child 3"
                    size="lg"
                    headshotUrl="https://models.readyplayer.me/ABCD12.png"
                    autoGenerate={true}
                  />
                  <span className="text-sm">Large (with PNG URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture
                    name="No Avatar Child"
                    size="md"
                    autoGenerate={false}
                  />
                  <span className="text-sm">No avatar (fallback)</span>
                </div>
              </div>
            </div>

            {/* ChildAvatarDisplay Component Tests */}
            <div className="space-y-4">
              <h3 className="font-semibold">ChildAvatarDisplay Component</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ChildAvatarDisplay
                    childName="Test Child 1"
                    size="small"
                    avatarUrl="https://models.readyplayer.me/ABCD12.glb"
                    autoGenerateFromAvatar={true}
                  />
                  <span className="text-sm">Small (with GLB URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChildAvatarDisplay
                    childName="Test Child 2"
                    size="medium"
                    avatarUrl="https://models.readyplayer.me/XYZ789.glb"
                    autoGenerateFromAvatar={true}
                  />
                  <span className="text-sm">Medium (with GLB URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChildAvatarDisplay
                    childName="Test Child 3"
                    size="large"
                    headshotUrl="https://models.readyplayer.me/ABCD12.png"
                    autoGenerateFromAvatar={true}
                  />
                  <span className="text-sm">Large (with PNG URL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChildAvatarDisplay
                    childName="No Avatar Child"
                    size="medium"
                    autoGenerateFromAvatar={false}
                  />
                  <span className="text-sm">No avatar (fallback)</span>
                </div>
              </div>
            </div>

            {/* Size Comparison */}
            <div className="space-y-4">
              <h3 className="font-semibold">Size Comparison</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ProfilePicture name="XS" size="xs" />
                  <span className="text-sm">XS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture name="SM" size="sm" />
                  <span className="text-sm">SM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture name="MD" size="md" />
                  <span className="text-sm">MD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture name="LG" size="lg" />
                  <span className="text-sm">LG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ProfilePicture name="XL" size="xl" />
                  <span className="text-sm">XL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {testResults.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}