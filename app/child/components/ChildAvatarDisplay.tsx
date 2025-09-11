'use client'

import React, { useState, useEffect } from 'react'
import ProfilePicture from '@/components/ProfilePicture'
import { AvatarUrlValidator } from '@/lib/avatar-url-validator'
import { useSafeAvatar } from '@/lib/avatar-error-prevention'
import { useAvatarRefresh } from '@/lib/avatar-refresh-manager'

interface ChildAvatarDisplayProps {
  avatarUrl?: string | null
  headshotUrl?: string | null
  childName: string
  childId?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  autoGenerateFromAvatar?: boolean
  onHeadshotGenerated?: (headshotUrl: string) => void
}

export const ChildAvatarDisplay: React.FC<ChildAvatarDisplayProps> = ({
  avatarUrl,
  headshotUrl,
  childName,
  childId,
  size = 'medium',
  className = '',
  autoGenerateFromAvatar = true,
  onHeadshotGenerated
}) => {
  const [refreshKey, setRefreshKey] = useState(0)

  // Map child-specific sizes to ProfilePicture sizes
  const sizeMapping = {
    small: 'sm' as const,
    medium: 'md' as const,
    large: 'lg' as const
  }

  // Use the avatar refresh hook to listen for updates to this specific child
  useAvatarRefresh(childId || '', () => {
    console.log('ChildAvatarDisplay: Avatar refresh triggered for child', childId)
    setRefreshKey(prev => prev + 1)
  })

  // Process avatar URLs to get the best display URL for profile pictures
  // Add refreshKey to force re-evaluation when profile updates
  const primaryUrl = headshotUrl || (avatarUrl ? AvatarUrlValidator.getBestDisplayUrl(avatarUrl, true) : null)
  const fallbackUrl = avatarUrl && avatarUrl !== primaryUrl ? AvatarUrlValidator.getBestDisplayUrl(avatarUrl, false) : null

  // Use the safe avatar hook for error prevention
  const { safeUrl: displayUrl, isLoading, error } = useSafeAvatar(primaryUrl, fallbackUrl)

  // Debug logging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChildAvatarDisplay:', {
        childName,
        avatarUrl,
        headshotUrl,
        displayUrl,
        size,
        error,
        refreshKey
      })
    }
  }, [childName, avatarUrl, headshotUrl, displayUrl, size, error, refreshKey])

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <ProfilePicture
      avatarUrl={displayUrl}
      headshotUrl={headshotUrl}
      name={childName}
      size={sizeMapping[size]}
      className={className}
      autoGenerate={autoGenerateFromAvatar}
      onHeadshotGenerated={onHeadshotGenerated}
      childId={childId}
      fallbackIcon={<span className="text-gray-500">🦸</span>}
    />
  )
}

export default ChildAvatarDisplay