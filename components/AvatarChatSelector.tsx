'use client'

import React from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { Mic, Type, ArrowLeft } from 'lucide-react'

interface AvatarChatSelectorProps {
  avatarUrl: string
  childId?: string
  onBack?: () => void
  onModeSelect: (mode: 'text' | 'voice') => void
}

export const AvatarChatSelector: React.FC<AvatarChatSelectorProps> = ({
  avatarUrl,
  childId = "test-child-123",
  onBack,
  onModeSelect
}) => {
  return (
    <div className="h-full bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-800">Chat with Your Avatar</h1>
        <div className="w-20" /> {/* Spacer for alignment */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Avatar Section */}
        <div className="w-2/5 p-4 flex items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden">
              <SimpleAvatarViewer 
                avatarUrl={avatarUrl} 
                enableControls={false}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Selection Section */}
        <div className="w-3/5 p-4 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg">
            {/* Mode Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
                How would you like to chat?
              </h2>
              
              <button
                onClick={() => onModeSelect('text')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Type className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Text Chat</h3>
                  <p className="text-blue-100 text-sm">Type messages and hear responses</p>
                </div>
              </button>

              <button
                onClick={() => onModeSelect('voice')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="p-2 bg-white/20 rounded-lg">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Voice Chat</h3>
                  <p className="text-purple-100 text-sm">Continuous audio conversation</p>
                </div>
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              Choose your preferred way to interact with your avatar
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarChatSelector
