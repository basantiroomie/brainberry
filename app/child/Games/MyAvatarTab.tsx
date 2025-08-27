'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'
import { Palette, Save, RotateCcw, Loader2, User, ArrowLeft, Camera, Edit3 } from 'lucide-react'

interface MyAvatarTabProps {
  childId?: string
  onBack?: () => void
}

interface ChildProfile {
  id: string
  name: string
  avatar_url?: string | null
  avatar_headshot_url?: string | null
}

export default function MyAvatarTab({ childId, onBack }: MyAvatarTabProps) {
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRPMIframe, setShowRPMIframe] = useState(false)
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load child profile and avatar data
  useEffect(() => {
    const loadChildProfile = async () => {
      try {
        // Get child profile from sessionStorage first
        const stored = sessionStorage.getItem('childProfile')
        if (stored) {
          const profile = JSON.parse(stored)
          setChildProfile(profile)
        } else if (childId) {
          // Fallback: fetch from API if childId is provided
          const response = await fetch(`/api/children/${childId}`)
          if (response.ok) {
            const profile = await response.json()
            setChildProfile(profile)
          }
        }
      } catch (error) {
        console.error('Failed to load child profile:', error)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    loadChildProfile()
  }, [childId])

  // Handle Ready Player Me iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://brainberry.readyplayer.me') return

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        
        if (data.eventName === 'v1.avatar.exported') {
          console.log('Avatar exported:', data)
          handleAvatarCreated(data.data.url)
        } else if (data.eventName === 'v1.frame.ready') {
          console.log('Ready Player Me iframe ready')
        }
      } catch (error) {
        console.error('Error parsing RPM message:', error)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Handle avatar creation/update
  const handleAvatarCreated = useCallback(async (avatarUrl: string) => {
    if (!childProfile) return

    setIsCreatingAvatar(true)
    setError(null)

    try {
      const response = await fetch('/api/avatars/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childProfile.id,
          avatarUrl: avatarUrl
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the child profile with new avatar URL
        const updatedProfile = {
          ...childProfile,
          avatar_url: result.avatarUrl || avatarUrl,
          avatar_headshot_url: result.headshotUrl
        }
        
        setChildProfile(updatedProfile)
        
        // Update sessionStorage
        sessionStorage.setItem('childProfile', JSON.stringify(updatedProfile))
        
        // Close the iframe
        setShowRPMIframe(false)
        
        console.log('Avatar saved successfully!')
      } else {
        throw new Error('Failed to save avatar')
      }
    } catch (error) {
      console.error('Failed to save avatar:', error)
      setError('Failed to save your avatar. Please try again.')
    } finally {
      setIsCreatingAvatar(false)
    }
  }, [childProfile])

  // Open Ready Player Me customizer
  const openAvatarCustomizer = useCallback(() => {
    setShowRPMIframe(true)
    setError(null)
  }, [])

  // Close Ready Player Me customizer
  const closeAvatarCustomizer = useCallback(() => {
    setShowRPMIframe(false)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AVATAR!</h1>
          <p className="text-lg text-gray-700">Loading your awesome avatar...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-chart-3" />
        </div>
      </div>
    )
  }

  // Ready Player Me iframe overlay
  if (showRPMIframe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-brutal-xl w-full max-w-4xl h-full max-h-[90vh] relative">
          <div className="flex items-center justify-between p-4 border-b-4 border-black">
            <h2 className="text-2xl font-bold">Create Your Avatar!</h2>
            <button
              onClick={closeAvatarCustomizer}
              className="px-4 py-2 bg-red-500 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              CLOSE
            </button>
          </div>
          <div className="h-full">
            <iframe
              ref={iframeRef}
              src={`https://brainberry.readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody${childProfile?.avatar_url ? `&url=${encodeURIComponent(childProfile.avatar_url)}` : ''}`}
              className="w-full h-full border-none"
              allow="camera *; microphone *"
            />
          </div>
          {isCreatingAvatar && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-chart-3 mx-auto mb-4" />
                <p className="text-lg font-bold">Saving your awesome avatar...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentAvatarUrl = childProfile?.avatar_url && typeof childProfile.avatar_url === 'string' && childProfile.avatar_url.trim() !== '' 
    ? childProfile.avatar_url 
    : null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK
          </button>
        )}
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AVATAR!</h1>
          <p className="text-lg text-gray-700">Make your character look amazing!</p>
        </div>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Preview */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Your Avatar</h2>
          <div className="aspect-square bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden">
            {currentAvatarUrl ? (
              <AvatarViewer
                avatarUrl={currentAvatarUrl}
                enableControls={true}
                enableAnimations={true}
                cameraMode="full"
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                  <div className="bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-bold">No Avatar Yet!</p>
                  <p className="text-sm text-gray-500 mt-2">Create one below</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Actions */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Avatar Actions</h2>
          
          <div className="space-y-4">
            {!currentAvatarUrl ? (
              <button
                onClick={openAvatarCustomizer}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-chart-2 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg transform hover:-rotate-1"
              >
                <Camera className="h-6 w-6" />
                CREATE AVATAR
              </button>
            ) : (
              <button
                onClick={openAvatarCustomizer}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-chart-3 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg transform hover:rotate-1"
              >
                <Edit3 className="h-6 w-6" />
                CUSTOMIZE AVATAR
              </button>
            )}
            
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">How it works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Take a selfie or upload a photo</li>
                <li>• Customize hair, clothes, and accessories</li>
                <li>• Your avatar will appear in games and chats</li>
                <li>• You can change it anytime!</li>
              </ul>
            </div>

            {currentAvatarUrl && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">✨ Avatar Ready!</h3>
                <p className="text-sm text-green-600">
                  Your awesome avatar is ready to use in games and chats. You can customize it anytime by clicking the button above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}