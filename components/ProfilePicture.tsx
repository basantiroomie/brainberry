'use client'

import React, { useState, useEffect } from 'react'
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
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    setIsLoading(true)
    setImageError(false)

    let finalUrl: string | null = null

    // Priority 1: Use the explicit headshotUrl if provided.
    if (headshotUrl) {
      finalUrl = headshotUrl
    } 
    // Priority 2: Derive the .png URL from the .glb avatarUrl.
    else if (avatarUrl && avatarUrl.endsWith('.glb')) {
      finalUrl = avatarUrl.replace('.glb', '.png')
    } 
    // Priority 3: Use the avatarUrl if it's already a .png
    else if (avatarUrl && avatarUrl.endsWith('.png')) {
      finalUrl = avatarUrl
    }

    setDisplayUrl(finalUrl)

    // If no direct image URL is found and auto-generation is enabled,
    // the HeadshotGenerator component will handle it.
    if (!finalUrl) {
      setIsLoading(false)
    }

  }, [avatarUrl, headshotUrl])

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.warn(`Failed to load profile picture: ${displayUrl}`)
    setImageError(true)
    setIsLoading(false)
  }

  const handleGenerated = (generatedUrl: string) => {
    setDisplayUrl(generatedUrl)
    onHeadshotGenerated?.(generatedUrl)
  }

  const showFallback = !displayUrl || imageError
  const showGenerator = !displayUrl && !imageError && autoGenerate && avatarUrl && childId

  return (
    <div className={`${sizeClasses[size]} bg-gray-200 border-2 border-black rounded-full overflow-hidden flex items-center justify-center relative ${className}`}>
      {isLoading && !showFallback && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
      
      {displayUrl && !imageError && (
        <img 
          src={displayUrl}
          alt={`${name}'s profile`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      )}
      
      {showFallback && (fallbackIcon || <span className={`${iconSizes[size]} text-gray-500`}>?</span>)}

      {showGenerator && (
        <HeadshotGenerator
          avatarUrl={avatarUrl}
          childId={childId}
          onHeadshotGenerated={handleGenerated}
          onError={() => setIsLoading(false)} // Stop loading on generation error
        />
      )}
    </div>
  )
}

export default ProfilePicture