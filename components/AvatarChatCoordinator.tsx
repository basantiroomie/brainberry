'use client'

import React, { useState } from 'react'
import { AvatarChatSelector } from './AvatarChatSelector'
import { AvatarTextChat } from './AvatarTextChat'
import { AvatarVoiceChat } from './AvatarVoiceChat'

interface AvatarChatCoordinatorProps {
  avatarUrl: string
  childId?: string
  onBack?: () => void
}

type ChatMode = 'selector' | 'text' | 'voice'

export const AvatarChatCoordinator: React.FC<AvatarChatCoordinatorProps> = ({
  avatarUrl,
  childId,
  onBack
}) => {
  const [currentMode, setCurrentMode] = useState<ChatMode>('selector')

  const handleModeSelect = (mode: 'text' | 'voice') => {
    setCurrentMode(mode)
  }

  const handleBackToSelector = () => {
    setCurrentMode('selector')
  }

  const handleBackToMain = () => {
    if (onBack) {
      onBack()
    } else {
      setCurrentMode('selector')
    }
  }

  switch (currentMode) {
    case 'text':
      return (
        <AvatarTextChat
          avatarUrl={avatarUrl}
          childId={childId}
          onBack={handleBackToSelector}
        />
      )
    
    case 'voice':
      return (
        <AvatarVoiceChat
          avatarUrl={avatarUrl}
          childId={childId}
          onBack={handleBackToSelector}
        />
      )
    
    case 'selector':
    default:
      return (
        <AvatarChatSelector
          avatarUrl={avatarUrl}
          childId={childId}
          onBack={handleBackToMain}
          onModeSelect={handleModeSelect}
        />
      )
  }
}

export default AvatarChatCoordinator
