'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'
import { AvatarChatbotErrorBoundary } from '@/components/AvatarErrorBoundary'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { logger } from '@/utils/logger'
import { 
  measureAvatarOperation, 
  recordAvatarEvent 
} from '@/lib/avatar-performance-monitor'
import { 
  handleAvatarError, 
  AvatarErrorType 
} from '@/lib/avatar-error-handler'
import { retryTTSOperation, retryApiCall } from '@/lib/avatar-retry-manager'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  facialExpression?: 'smile' | 'neutral' | 'excited'
  animation?: 'Idle' | 'Talking' | 'Listening'
}

interface AvatarChatbotProps {
  avatarUrl: string
  childId: string
  accessCode?: string
  onMessageSent?: (message: string) => void
}

export const AvatarChatbot: React.FC<AvatarChatbotProps> = ({
  avatarUrl,
  childId,
  accessCode,
  onMessageSent
}) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentBlendShapes, setCurrentBlendShapes] = useState<Partial<BlendShapeTargets>>({})
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const idleAnimationRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // TTS Configuration
  const ttsConfig = {
    rate: 0.9,
    pitch: 1.1,
    volume: 0.8,
    preferredVoices: [
      'Google US English',
      'Microsoft Zira - English (United States)',
      'Alex',
      'Samantha'
    ]
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize lipsync manager
  useEffect(() => {
    const lipsyncManager = lipsyncManagerRef.current
    
    // Set up viseme callback to update avatar morph targets
    lipsyncManager.setVisemeCallback((blendShapes: Partial<BlendShapeTargets>) => {
      setCurrentBlendShapes(blendShapes)
      applyBlendShapesToAvatar(blendShapes)
    })

    return () => {
      lipsyncManager.dispose()
    }
  }, [])

  // Apply blend shapes to avatar model
  const applyBlendShapesToAvatar = useCallback((blendShapes: Partial<BlendShapeTargets>) => {
    if (!avatarModelRef.current) return

    // Find the avatar mesh with morph targets
    avatarModelRef.current.traverse((child) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        const mesh = child as Mesh | SkinnedMesh
        
        if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
          // Apply each blend shape to the corresponding morph target
          Object.entries(blendShapes).forEach(([targetName, value]) => {
            const index = mesh.morphTargetDictionary[targetName]
            if (index !== undefined && typeof value === 'number') {
              mesh.morphTargetInfluences[index] = value
            }
          })
        }
      }
    })
  }, [])

  // Handle avatar model load
  const handleAvatarLoad = useCallback((model: Object3D) => {
    avatarModelRef.current = model
    logger.debug('Avatar model loaded for chatbot', 'AVATAR_CHATBOT', { 
      childId,
      hasModel: !!model 
    })
    
    // Start idle animations
    startIdleAnimations()
  }, [childId])

  // Start idle animations (blinking, subtle movements)
  const startIdleAnimations = useCallback(() => {
    if (isSpeaking) return

    const performIdleAnimation = () => {
      if (isSpeaking) return

      // Random blink animation
      if (Math.random() < 0.3) {
        const blinkShapes = {
          eyeBlinkLeft: 1.0,
          eyeBlinkRight: 1.0
        }
        
        applyBlendShapesToAvatar(blinkShapes)
        
        // Reset blink after short duration
        setTimeout(() => {
          if (!isSpeaking) {
            applyBlendShapesToAvatar({
              eyeBlinkLeft: 0.0,
              eyeBlinkRight: 0.0
            })
          }
        }, 150)
      }

      // Schedule next idle animation
      if (!isSpeaking) {
        idleAnimationRef.current = window.setTimeout(performIdleAnimation, 2000 + Math.random() * 3000)
      }
    }

    // Start idle animation loop
    idleAnimationRef.current = window.setTimeout(performIdleAnimation, 1000)
  }, [isSpeaking, applyBlendShapesToAvatar])

  // Stop idle animations
  const stopIdleAnimations = useCallback(() => {
    if (idleAnimationRef.current) {
      clearTimeout(idleAnimationRef.current)
      idleAnimationRef.current = null
    }
  }, [])

  // Get best available TTS voice
  const getBestTTSVoice = useCallback(() => {
    const voices = speechSynthesis.getVoices()
    
    // Try to find preferred voices
    for (const preferredVoice of ttsConfig.preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferredVoice))
      if (voice) return voice
    }
    
    // Fallback to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'))
    return englishVoice || voices[0]
  }, [])

  // Speak text using TTS with lip-sync and error handling
  const speakText = useCallback(async (text: string, facialExpression?: string) => {
    if (isSpeaking) {
      // Cancel current speech
      speechSynthesis.cancel()
    }

    setIsSpeaking(true)
    stopIdleAnimations()

    // Use retry mechanism for TTS operations
    const ttsResult = await retryTTSOperation(
      async () => {
        return new Promise<void>((resolve, reject) => {
          try {
            const utterance = new SpeechSynthesisUtterance(text)
            const voice = getBestTTSVoice()
            
            if (voice) {
              utterance.voice = voice
            }
            
            utterance.rate = ttsConfig.rate
            utterance.pitch = ttsConfig.pitch
            utterance.volume = ttsConfig.volume

            // Set up lipsync processing for speech synthesis
            lipsyncManagerRef.current.processSpeechSynthesis(utterance)

            utterance.onstart = () => {
              recordAvatarEvent('tts', 'speech-start', 0, { 
                textLength: text.length,
                voice: voice?.name 
              })
              logger.debug('TTS started', 'AVATAR_CHATBOT', { text: text.substring(0, 50) })
            }

            utterance.onend = () => {
              setIsSpeaking(false)
              
              // Reset to neutral expression
              const neutralShapes = {
                jawOpen: 0.0,
                mouthSmile: facialExpression === 'smile' ? 0.3 : 0.0,
                mouthFunnel: 0.0
              }
              applyBlendShapesToAvatar(neutralShapes)
              
              // Restart idle animations
              startIdleAnimations()
              
              recordAvatarEvent('tts', 'speech-end', 0)
              logger.debug('TTS ended', 'AVATAR_CHATBOT')
              resolve()
            }

            utterance.onerror = (event) => {
              const error = new Error(`TTS error: ${event.error}`)
              
              handleAvatarError(
                AvatarErrorType.TTS_ERROR,
                'Text-to-speech failed',
                error,
                { 
                  childId,
                  operation: 'tts-speak',
                  textLength: text.length 
                }
              )

              setIsSpeaking(false)
              startIdleAnimations()
              reject(error)
            }

            speechSynthesisRef.current = utterance
            speechSynthesis.speak(utterance)

          } catch (error) {
            const ttsError = error instanceof Error ? error : new Error(String(error))
            
            handleAvatarError(
              AvatarErrorType.TTS_ERROR,
              'Failed to initialize TTS',
              ttsError,
              { childId, operation: 'tts-init' }
            )

            setIsSpeaking(false)
            startIdleAnimations()
            reject(ttsError)
          }
        })
      },
      text
    )

    if (!ttsResult.success) {
      logger.error('TTS operation failed after retries', ttsResult.error, 'AVATAR_CHATBOT')
      setIsSpeaking(false)
      startIdleAnimations()
    }
  }, [isSpeaking, getBestTTSVoice, applyBlendShapesToAvatar, startIdleAnimations, stopIdleAnimations, childId])

  // Send message to chat API with retry mechanism
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'child',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    onMessageSent?.(message.trim())

    // Use retry mechanism for API calls
    const apiResult = await measureAvatarOperation(
      'render',
      'chat-api-call',
      async () => {
        return retryApiCall(
          async () => {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: message.trim(),
                childId,
                accessCode
              })
            })

            if (!response.ok) {
              throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
            }

            return response.json()
          },
          '/api/chat'
        )
      },
      { messageLength: message.length, childId }
    )

    try {
      if (apiResult.success && apiResult.data) {
        const data = apiResult.data
        
        const avatarMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.text,
          sender: 'avatar',
          timestamp: new Date(),
          facialExpression: data.facialExpression,
          animation: data.animation
        }

        setMessages(prev => [...prev, avatarMessage])
        
        // Speak the avatar's response
        await speakText(data.text, data.facialExpression)

      } else {
        throw apiResult.error || new Error('API call failed')
      }

    } catch (error) {
      handleAvatarError(
        AvatarErrorType.NETWORK_ERROR,
        'Chat API request failed',
        error instanceof Error ? error : new Error(String(error)),
        { 
          childId, 
          operation: 'chat-api',
          messageLength: message.length 
        }
      )
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Can you try again?",
        sender: 'avatar',
        timestamp: new Date(),
        facialExpression: 'neutral'
      }
      
      setMessages(prev => [...prev, errorMessage])
      await speakText(errorMessage.text, 'neutral')
    } finally {
      setIsLoading(false)
    }
  }, [childId, accessCode, isLoading, onMessageSent, speakText])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel()
      }
      stopIdleAnimations()
    }
  }, [stopIdleAnimations])

  return (
    <AvatarChatbotErrorBoundary avatarUrl={avatarUrl} childId={childId}>
      <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-purple-50">
        {/* Avatar Display */}
        <div className="flex-shrink-0 h-64 bg-white rounded-lg shadow-sm m-4 overflow-hidden">
          <AvatarViewer
            avatarUrl={avatarUrl}
            enableControls={false}
            enableAnimations={true}
            cameraMode="headshot"
            onModelLoad={handleAvatarLoad}
            onModelError={(error) => {
              handleAvatarError(
                AvatarErrorType.RENDERING_ERROR,
                'Avatar model failed to load in chatbot',
                error,
                { avatarUrl, childId, operation: 'chatbot-avatar-load' }
              )
            }}
            className="w-full h-full"
          />
        </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">Hi there! 👋</p>
              <p className="text-sm text-gray-500 mt-1">Start a conversation with your avatar!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'child' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'child'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
            disabled={isLoading || isSpeaking}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || isSpeaking}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {isSpeaking && (
          <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Avatar is speaking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </AvatarChatbotErrorBoundary>
  )
}

export default AvatarChatbot