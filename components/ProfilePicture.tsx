'use client'

import React, { useState, useEffect } from 'react'
import HeadshotGenerator from './HeadshotGenerator'
import AvatarSnapshotGenerator from './AvatarSnapshotGenerator'
import SimpleProfileGenerator from './SimpleProfileGenerator'

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
  useSnapshot?: boolean // Use 3D avatar snapshot instead of headshot generation
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
  childId,
  useSnapshot = true
}) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarFailed, setAvatarFailed] = useState(false)

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

    // Priority 1: Use the explicit headshotUrl if provided and it's a valid data URL
    if (headshotUrl && headshotUrl.startsWith('data:image/')) {
      finalUrl = headshotUrl
    } 
    // Priority 2: Try Ready Player Me PNG URL for GLB avatars with long codes
    else if (avatarUrl && avatarUrl.endsWith('.glb')) {
      const avatarId = avatarUrl.split('/').pop()?.replace('.glb', '') || ''
      // Only try PNG URL for long codes (24+ characters), short codes don't work
      if (avatarId.length >= 24) {
        finalUrl = avatarUrl.replace('.glb', '.png')
      }
    }
    // Priority 3: Use the avatarUrl if it's already a valid image URL
    else if (avatarUrl && (avatarUrl.endsWith('.png') || avatarUrl.endsWith('.jpg'))) {
      finalUrl = avatarUrl
    }

    setDisplayUrl(finalUrl)

    // If no direct image URL is found, let the generator handle it
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
    setIsLoading(false)
    onHeadshotGenerated?.(generatedUrl)
  }

  const handleAvatarError = () => {
    console.warn('Avatar snapshot generation failed, using simple profile generator')
    setAvatarFailed(true)
    setIsLoading(false)
  }

  const showFallback = !displayUrl || imageError
  const showGenerator = !displayUrl && !imageError && autoGenerate && childId
  const showSnapshotGenerator = useSnapshot && showGenerator && avatarUrl?.endsWith('.glb') && !avatarFailed
  const showSimpleGenerator = showGenerator && (avatarFailed || !avatarUrl)

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

      {showSnapshotGenerator ? (
        <AvatarSnapshotGenerator
          avatarUrl={avatarUrl}
          onSnapshotGenerated={handleGenerated}
          onError={handleAvatarError}
          size={size === 'xl' ? 256 : size === 'lg' ? 128 : 64}
          autoGenerate={true}
          className="absolute inset-0"
          childId={childId}
        />
      ) : showSimpleGenerator ? (
        <SimpleProfileGenerator
          childName={name}
          childId={childId}
          onProfileGenerated={handleGenerated}
          size={size === 'xl' ? 256 : size === 'lg' ? 128 : 64}
        />
      ) : showGenerator && (
        <HeadshotGenerator
          avatarUrl={avatarUrl}
          childId={childId}
          onHeadshotGenerated={handleGenerated}
          onError={handleAvatarError}
        />
      )}
    </div>
  )
}

export default ProfilePicture