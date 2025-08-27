'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getHeadshotGenerator } from '@/lib/avatar-headshot-generator'

interface HeadshotGeneratorProps {
  avatarUrl: string
  childId: string
  onHeadshotGenerated: (headshotUrl: string) => void
  onError?: (error: string) => void
  autoGenerate?: boolean
}

export const HeadshotGenerator: React.FC<HeadshotGeneratorProps> = ({
  avatarUrl,
  childId,
  onHeadshotGenerated,
  onError,
  autoGenerate = true
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedHeadshot, setGeneratedHeadshot] = useState<string | null>(null)
  const hasGenerated = useRef(false)

  const generateHeadshot = async () => {
    if (isGenerating || hasGenerated.current) return

    setIsGenerating(true)
    hasGenerated.current = true

    try {
      console.log('Generating headshot from avatar URL:', avatarUrl)
      
      // Validate avatar URL first
      if (!avatarUrl || !avatarUrl.endsWith('.glb')) {
        throw new Error('Invalid avatar URL - must be a .glb file')
      }

      // Test if the URL is accessible (skip for ReadyPlayer.me URLs)
      if (!avatarUrl.includes('readyplayer.me') && !avatarUrl.includes('models.readyplayer.me')) {
        const testResponse = await fetch(avatarUrl, { method: 'HEAD' })
        if (!testResponse.ok) {
          throw new Error(`Avatar URL not accessible: ${testResponse.status}`)
        }
      }
      
      const generator = getHeadshotGenerator()
      const headshotDataUrl = await generator.generateHeadshot(avatarUrl)
      
      if (!headshotDataUrl || !headshotDataUrl.startsWith('data:image/')) {
        throw new Error('Generated headshot is not a valid image')
      }
      
      setGeneratedHeadshot(headshotDataUrl)
      
      // Save the headshot to the database with better error handling
      try {
        const response = await fetch('/api/avatars/save-headshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            childId,
            headshotDataUrl
          })
        })

        if (response.ok) {
          // Check if response is actually JSON
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json()
            console.log('Headshot saved successfully:', result.headshotUrl)
            onHeadshotGenerated(result.headshotUrl)
          } else {
            // Response is not JSON, probably an error page
            console.warn('Server returned non-JSON response, using data URL')
            onHeadshotGenerated(headshotDataUrl)
          }
        } else {
          // HTTP error status
          console.warn(`Failed to save headshot (${response.status}), using data URL`)
          onHeadshotGenerated(headshotDataUrl)
        }
      } catch (saveError) {
        // Network error or JSON parsing error
        console.warn('Error saving headshot to server:', saveError)
        console.log('Using generated data URL instead')
        onHeadshotGenerated(headshotDataUrl)
      }

    } catch (error) {
      console.error('Failed to generate headshot:', error)
      
      // Try fallback: convert GLB URL to PNG URL
      try {
        if (avatarUrl.endsWith('.glb')) {
          const pngUrl = avatarUrl.replace('.glb', '.png')
          console.log('Trying fallback PNG URL:', pngUrl)
          
          // Test if PNG URL is accessible
          const pngResponse = await fetch(pngUrl, { method: 'HEAD' })
          if (pngResponse.ok) {
            console.log('Using fallback PNG URL instead of 3D generation')
            onHeadshotGenerated(pngUrl)
            return
          }
        }
      } catch (fallbackError) {
        console.warn('Fallback PNG URL also failed:', fallbackError)
      }
      
      // If all else fails, call the error handler
      onError?.('Failed to generate profile picture from avatar')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (autoGenerate && avatarUrl && !hasGenerated.current) {
      // Small delay to ensure the component is mounted
      const timer = setTimeout(generateHeadshot, 1000)
      return () => clearTimeout(timer)
    }
  }, [avatarUrl, autoGenerate])

  if (!avatarUrl) return null

  return (
    <div className="headshot-generator">
      {isGenerating && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Generating profile picture...</span>
        </div>
      )}
      
      {generatedHeadshot && (
        <div className="mt-2">
          <img 
            src={generatedHeadshot} 
            alt="Generated headshot" 
            className="w-16 h-16 rounded-full border-2 border-gray-300"
          />
        </div>
      )}
      
      {!autoGenerate && !isGenerating && (
        <button
          onClick={generateHeadshot}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          Generate Profile Picture
        </button>
      )}
    </div>
  )
}

export default HeadshotGenerator