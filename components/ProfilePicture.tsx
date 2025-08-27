'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ProfilePictureUtils, AvatarCodeUtils } from '@/lib/avatar-utils'
import { AvatarUrlValidator } from '@/lib/avatar-url-validator'
import HeadshotGenerator from './HeadshotGenerator'

interface ProfilePictureProps {
  avatarUrl?: string | null
  headshotUrl?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  autoGenerate?: boolean
  fallbackIcon?: React.ReactNode
  onHeadshotGenerated?: (headshotUrl: string) => void
  childId?: string // Add childId for headshot generation
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  avatarUrl,
  headshotUrl,
  name,
  size = 'md',
  className = '',
  autoGenerate = true,
  fallbackIcon,
  onHeadshotGenerated,
  childId
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedHeadshot, setGeneratedHeadshot] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shouldGenerateHeadshot, setShouldGenerateHeadshot] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const iconSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  }

  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96
  }

  // Auto-generate profile picture from avatar URL if headshot is not available
  const generateProfilePicture = useCallback(async () => {
    if (!autoGenerate || !avatarUrl || headshotUrl || isGenerating) {
      return
    }

    setIsGenerating(true)
    
    try {
      console.log('Attempting to generate profile picture from avatar URL:', avatarUrl)
      
      // First, try to use Ready Player Me PNG URL directly
      let pngUrl: string | null = null
      
      if (avatarUrl.endsWith('.glb')) {
        pngUrl = avatarUrl.replace('.glb', '.png')
      } else {
        const code = AvatarCodeUtils.extractCodeFromGlbUrl(avatarUrl)
        if (code) {
          pngUrl = AvatarCodeUtils.codeToPngUrl(code)
        }
      }
      
      if (pngUrl) {
        // Test if PNG URL is accessible
        const isAccessible = await ProfilePictureUtils.testPngUrlAccessibility(pngUrl)
        if (isAccessible) {
          console.log('Using Ready Player Me PNG URL directly:', pngUrl)
          setGeneratedHeadshot(pngUrl)
          
          // Notify parent component
          if (onHeadshotGenerated) {
            onHeadshotGenerated(pngUrl)
          }
          
          setIsGenerating(false)
          return
        }
      }
      
      // Fallback: Generate from avatar URL
      const profilePicture = await ProfilePictureUtils.generateProfilePictureWithFallback(
        avatarUrl,
        pixelSizes[size]
      )
      
      if (profilePicture) {
        console.log('Profile picture generated successfully')
        setGeneratedHeadshot(profilePicture)
        
        // Notify parent component
        if (onHeadshotGenerated) {
          onHeadshotGenerated(profilePicture)
        }
      } else {
        console.warn('Failed to generate profile picture from avatar URL')
      }
    } catch (error) {
      console.error('Error generating profile picture:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [avatarUrl, headshotUrl, autoGenerate, isGenerating, size, onHeadshotGenerated])

  // Trigger profile picture generation when needed
  useEffect(() => {
    if (!headshotUrl && avatarUrl && autoGenerate && !generatedHeadshot && !isGenerating) {
      // First try the traditional method
      generateProfilePicture()
      
      // If that fails and we have a childId, try 3D headshot generation
      if (childId && AvatarUrlValidator.isValidAvatarUrl(avatarUrl) && avatarUrl.endsWith('.glb')) {
        setShouldGenerateHeadshot(true)
      }
    }
  }, [avatarUrl, headshotUrl, autoGenerate, generatedHeadshot, isGenerating, generateProfilePicture, childId])

  // Determine the best URL to display (priority: headshotUrl > generatedHeadshot > avatarUrl)
  const getDisplayUrl = (): string | null => {
    if (headshotUrl && !imageError) return headshotUrl
    if (generatedHeadshot && !imageError) return generatedHeadshot
    if (avatarUrl && !imageError) {
      // Try to convert GLB to PNG URL for direct display
      try {
        if (avatarUrl.endsWith('.glb')) {
          return avatarUrl.replace('.glb', '.png')
        }
        const code = AvatarCodeUtils.extractCodeFromGlbUrl(avatarUrl)
        if (code) {
          return AvatarCodeUtils.codeToPngUrl(code)
        }
      } catch (error) {
        console.warn('Could not convert avatar URL to PNG:', error)
      }
      return avatarUrl
    }
    return null
  }

  const displayUrl = getDisplayUrl()
  const hasAvatar = displayUrl && !imageError

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.warn('Image failed to load:', displayUrl)
    setImageError(true)
    setIsLoading(false)
    
    // If the current URL failed and we haven't tried generating yet, try generation
    if (!generatedHeadshot && !isGenerating && autoGenerate && avatarUrl) {
      generateProfilePicture()
    }
  }

  // Reset states when URLs change
  useEffect(() => {
    setImageError(false)
    setIsLoading(true)
    if (headshotUrl) {
      // If we have a headshot URL, clear any generated one
      setGeneratedHeadshot(null)
    }
  }, [headshotUrl, avatarUrl])

  const defaultFallback = fallbackIcon || (
    <span className={`${iconSizes[size]} text-gray-500`}>🦸</span>
  )

  return (
    <div className={`${sizeClasses[size]} bg-gray-200 border-2 border-black rounded-full overflow-hidden flex items-center justify-center relative ${className}`}>
      {hasAvatar && (
        <>
          {(isLoading || isGenerating) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={displayUrl}
            alt={`${name}'s Avatar`}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        </>
      )}
      {(!hasAvatar || imageError) && !isGenerating && defaultFallback}
      {isGenerating && !hasAvatar && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 3D Headshot Generator */}
      {shouldGenerateHeadshot && childId && avatarUrl && (
        <div className="absolute -bottom-8 left-0 right-0">
          <HeadshotGenerator
            avatarUrl={avatarUrl}
            childId={childId}
            onHeadshotGenerated={(headshotUrl) => {
              setGeneratedHeadshot(headshotUrl)
              setShouldGenerateHeadshot(false)
              onHeadshotGenerated?.(headshotUrl)
            }}
            onError={(error) => {
              console.warn('Headshot generation failed:', error)
              setShouldGenerateHeadshot(false)
              // Don't throw the error, just log it and continue
            }}
            autoGenerate={true}
          />
        </div>
      )}
    </div>
  )
}

export default ProfilePicture