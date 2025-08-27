'use client'

import React from 'react'

interface AvatarDebugInfoProps {
  childProfile: any
  className?: string
}

export const AvatarDebugInfo: React.FC<AvatarDebugInfoProps> = ({
  childProfile,
  className = ''
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`bg-yellow-100 border border-yellow-400 p-4 rounded-lg text-xs ${className}`}>
      <h4 className="font-bold text-yellow-800 mb-2">Avatar Debug Info</h4>
      <div className="space-y-1 text-yellow-700">
        <div><strong>Child ID:</strong> {childProfile?.id || 'N/A'}</div>
        <div><strong>Child Name:</strong> {childProfile?.name || 'N/A'}</div>
        <div><strong>Avatar URL:</strong> {childProfile?.avatar_url || 'N/A'}</div>
        <div><strong>Headshot URL:</strong> {childProfile?.avatar_headshot_url || 'N/A'}</div>
        <div><strong>Avatar URL Type:</strong> {typeof childProfile?.avatar_url}</div>
        <div><strong>Avatar URL Length:</strong> {childProfile?.avatar_url?.length || 0}</div>
        <div><strong>Has Avatar:</strong> {childProfile?.avatar_url ? 'Yes' : 'No'}</div>
        <div><strong>Profile Keys:</strong> {childProfile ? Object.keys(childProfile).join(', ') : 'N/A'}</div>
      </div>
    </div>
  )
}

export default AvatarDebugInfo