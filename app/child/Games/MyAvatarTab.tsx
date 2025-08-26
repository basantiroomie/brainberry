'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'
import { useAvatarCustomization, Asset, AssetCategory } from '@/hooks/use-avatar-customization'
import { Palette, Save, RotateCcw, Loader2, User, ArrowLeft } from 'lucide-react'

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
  const [selectedCategory, setSelectedCategory] = useState<string>('hair')
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)

  // Use custom avatar customization hook
  const {
    assets,
    selectedAssets,
    isLoading: assetsLoading,
    error: assetsError,
    loadAssets,
    selectAsset,
    resetSelection
  } = useAvatarCustomization()

  // Load child profile and avatar data
  useEffect(() => {
    const loadChildProfile = async () => {
      try {
        // Get child profile from sessionStorage first
        const stored = sessionStorage.getItem('childProfile')
        if (stored) {
          const profile = JSON.parse(stored)
          setChildProfile(profile)
          setOriginalAvatarUrl(profile.avatar_url || null)
          
          // If we have an avatar URL, we can proceed with customization
          if (profile.avatar_url) {
            setPreviewAvatarUrl(profile.avatar_url)
            await loadAssets()
          }
        } else if (childId) {
          // Fallback: fetch from API if childId is provided
          const response = await fetch(`/api/children/${childId}`)
          if (response.ok) {
            const profile = await response.json()
            setChildProfile(profile)
            setOriginalAvatarUrl(profile.avatar_url || null)
            
            if (profile.avatar_url) {
              setPreviewAvatarUrl(profile.avatar_url)
              await loadAssets()
            }
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

  // Handle asset selection
  const handleAssetSelect = useCallback((categoryId: string, assetId: string) => {
    selectAsset(categoryId, assetId)
    setHasChanges(true)
    
    // For now, we'll just track the changes
    // In a real implementation, you might want to generate a preview URL
    // based on the selected assets
  }, [selectAsset])

  // Save avatar customizations
  const handleSave = useCallback(async () => {
    if (!childProfile || !previewAvatarUrl) return

    setSaving(true)
    setError(null)

    try {
      // Call the avatar update API endpoint
      const response = await fetch('/api/avatars/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childProfile.id,
          avatarConfig: {
            id: childProfile.id,
            assets: selectedAssets,
            metadata: {
              created_from_photo: true,
              last_customized: new Date().toISOString(),
              customization_count: (childProfile as any).customization_count || 0 + 1
            }
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the child profile with new avatar URL
        const updatedProfile = {
          ...childProfile,
          avatar_url: result.avatarUrl || previewAvatarUrl,
          avatar_headshot_url: result.headshotUrl
        }
        
        setChildProfile(updatedProfile)
        setOriginalAvatarUrl(result.avatarUrl || previewAvatarUrl)
        setPreviewAvatarUrl(result.avatarUrl || previewAvatarUrl)
        setHasChanges(false)
        
        // Update sessionStorage
        sessionStorage.setItem('childProfile', JSON.stringify(updatedProfile))
        
        // Show success message (you could add a toast here)
        console.log('Avatar saved successfully!')
      } else {
        throw new Error('Failed to save avatar')
      }
    } catch (error) {
      console.error('Failed to save avatar:', error)
      setError('Failed to save your avatar. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [childProfile, previewAvatarUrl, selectedAssets])

  // Cancel changes and revert to original
  const handleCancel = useCallback(() => {
    resetSelection()
    setHasChanges(false)
    setError(null)
    setPreviewAvatarUrl(originalAvatarUrl)
  }, [originalAvatarUrl, resetSelection])

  // Loading state
  if (loading || assetsLoading) {
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

  // No avatar state
  if (!childProfile?.avatar_url && !previewAvatarUrl) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-chart-3 mb-2">MY AVATAR!</h1>
          <p className="text-lg text-gray-700">Make your character look amazing!</p>
        </div>
        
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold mb-4">No Avatar Yet!</h3>
          <p className="text-gray-600 mb-6">
            Ask your teacher to create an avatar for you first, then you can customize it here!
          </p>
          <div className="bg-chart-1 text-white px-6 py-3 border-2 border-black shadow-brutal font-bold rounded">
            Avatar Creation Required
          </div>
        </div>
      </div>
    )
  }

  const currentAvatarUrl = (previewAvatarUrl && typeof previewAvatarUrl === 'string' && previewAvatarUrl.trim() !== '') 
    ? previewAvatarUrl 
    : (childProfile?.avatar_url && typeof childProfile.avatar_url === 'string' && childProfile.avatar_url.trim() !== '') 
    ? childProfile.avatar_url 
    : null
  const availableCategories = assets.filter(category => category.assets.length > 0)

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

      {(error || assetsError) && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
          {error || assetsError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Preview */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Avatar Preview</h2>
          <div className="aspect-square bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden">
            <AvatarViewer
              avatarUrl={currentAvatarUrl}
              enableControls={true}
              enableAnimations={true}
              cameraMode="full"
              className="w-full h-full"
            />
          </div>
          
          {/* Save/Cancel Controls */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-black shadow-brutal font-bold transition-all ${
                hasChanges && !saving
                  ? 'bg-chart-2 text-white hover:shadow-brutal-lg hover:-rotate-1'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  SAVE CHANGES
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={!hasChanges || saving}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-black shadow-brutal font-bold transition-all ${
                hasChanges && !saving
                  ? 'bg-gray-500 text-white hover:shadow-brutal-lg hover:rotate-1'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              CANCEL
            </button>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Customize</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 border-2 border-black shadow-brutal font-bold text-sm transition-all transform ${
                  selectedCategory === category.id
                    ? 'bg-chart-4 text-white shadow-brutal-lg -rotate-1 scale-105'
                    : 'bg-white text-black hover:shadow-brutal-lg hover:rotate-1'
                }`}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Asset Grid */}
          <div className="max-h-96 overflow-y-auto">
            {availableCategories
              .filter(category => category.id === selectedCategory)
              .map((category) => (
                <div key={category.id} className="grid grid-cols-3 gap-3">
                  {category.assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleAssetSelect(category.id, asset.id)}
                      className={`aspect-square border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all transform hover:-rotate-1 ${
                        selectedAssets[category.id] === asset.id
                          ? 'bg-chart-3 border-chart-3'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkM5IDI2IDkgMTQgMjAgMTRTMzEgMjYgMjAgMjZaIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTgiIHI9IjQiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+'
                        }}
                      />
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}