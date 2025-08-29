'use client'

import React from 'react'
import ProfilePicture from '@/components/ProfilePicture'

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
  // Map child-specific sizes to ProfilePicture sizes
  const sizeMapping = {
    small: 'sm' as const,
    medium: 'md' as const,
    large: 'lg' as const
  }

  return (
    <ProfilePicture
      avatarUrl={avatarUrl}
      headshotUrl={headshotUrl}
      name={childName}
      size={sizeMapping[size]}
      className={className}
      autoGenerate={autoGenerateFromAvatar}
      onHeadshotGenerated={onHeadshotGenerated}
      childId={childId}
      useSnapshot={true} // Use 3D avatar snapshots for profile pictures
      fallbackIcon={<span className="text-gray-500">👤</span>}
    />
  )
}

export default ChildAvatarDisplay