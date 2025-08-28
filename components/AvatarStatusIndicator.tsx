'use client'

import React from 'react'
import { AvatarUrlValidator } from '@/lib/avatar-url-validator'

interface AvatarStatusIndicatorProps {
  avatarUrl?: string | null
  headshotUrl?: string | null
  childName?: string
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

export const AvatarStatusIndicator: React.FC<AvatarStatusIndicatorProps> = ({
  avatarUrl,
  headshotUrl,
  childName = 'Your',
  size = 'medium',
  showText = true,
  className = ''
}) => {
  const hasValidAvatar = AvatarUrlValidator.sanitizeAvatarUrl(avatarUrl) !== null
  const hasValidHeadshot = AvatarUrlValidator.sanitizeAvatarUrl(headshotUrl) !== null

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  const iconSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  if (hasValidAvatar) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 text-orange-600 ${className}`}>
      <div className={`${sizeClasses[size]} bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center`}>
        <span className={iconSizes[size]}>💬</span>
      </div>
      {showText && (
        <span className={`font-medium ${textSizes[size]}`}>
          Ask your educator to create a 3D avatar!
        </span>
      )}
    </div>
  )
}

export default AvatarStatusIndicator