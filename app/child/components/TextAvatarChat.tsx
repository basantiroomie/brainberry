'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Send, Volume2, VolumeX } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  audioUrl?: string
}

interface TextAvatarChatProps {
  avatarUrl: string
  childId?: string
  accessCode?: string
  onMessageSent?: (message: string) => void
}

export const TextAvatarChat: React.FC<TextAvatarChatProps> = ({
  avatarUrl,
  childId = "test-child-123",
  accessCode,
  onMessageSent
}) => {
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [childInfo, setChildInfo] = useState<{ name?: string; age?: number }>({})
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get child information from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('childProfile')
    if (stored) {
      try {
        const profile = JSON.parse(stored)
        setChildInfo({
          name: profile.name,
          age: profile.age
        })
        console.log('TextAvatarChat: Child info loaded:', { name: profile.name, age: profile.age })
      } catch (error) {
        console.error('Failed to parse child profile:', error)
      }
    }
  }, [])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Apply blend shapes to avatar
  const applyBlendShapesToAvatar = useCallback((blendShapes: Partial<BlendShapeTargets>) => {
    if (!avatarModelRef.current) return

    avatarModelRef.current.traverse((child: any) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        const mesh = child as Mesh | SkinnedMesh
        
        if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
          Object.entries(blendShapes).forEach(([targetName, value]) => {
            const index = mesh.morphTargetDictionary![targetName]
            if (index !== undefined && typeof value === 'number' && mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[index] = value
            }
          })
        }
      }
    })
  }, [])

  // Handle avatar load
  const handleAvatarLoad = useCallback((model: Object3D) => {
    avatarModelRef.current = model
    setAvatarLoaded(true)
    console.log('✅ Text Chat: Avatar loaded successfully')
  }, [])

  const handleAvatarError = useCallback((error: any) => {
    console.error('❌ Text Chat: Avatar loading error:', error)
    setAvatarLoaded(false)
  }, [])

  // Browser TTS with lip sync
  const speakText = useCallback(async (text: string) => {
    if (!audioEnabled || isSpeaking) return

    setIsSpeaking(true)

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      // Set up lip sync
      lipsyncManagerRef.current.processSpeechSynthesis(utterance)

      utterance.onstart = () => {
        console.log('🔊 Text TTS Started:', text.substring(0, 50))
      }

      utterance.onend = () => {
        console.log('🔊 Text TTS Finished')
        setIsSpeaking(false)
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('🔊 Text TTS Error:', event.error)
        setIsSpeaking(false)
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }, [audioEnabled, isSpeaking, applyBlendShapesToAvatar])

  // Audio playback with lip sync
  const playAudioWithLipSync = useCallback(async (audioUrl: string, text: string) => {
    if (!audioEnabled || !avatarLoaded) return

    setIsSpeaking(true)

    try {
      const audio = new Audio(audioUrl)
      
      audio.onplay = () => {
        console.log('🎵 Playing Gemini audio in text chat')
        // Simple lip sync animation
        const animateToAudio = () => {
          if (audio.paused || audio.ended) {
            setIsSpeaking(false)
            applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
            return
          }
          
          const time = audio.currentTime
          const intensity = Math.sin(time * 10) * 0.5 + 0.5
          
          applyBlendShapesToAvatar({
            jawOpen: intensity * 0.7,
            mouthSmile: intensity * 0.3,
            mouthFunnel: intensity * 0.4
          })
          
          requestAnimationFrame(animateToAudio)
        }
        animateToAudio()
      }
      
      audio.onended = () => {
        setIsSpeaking(false)
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('🎵 Audio playback error:', error)
      setIsSpeaking(false)
      // Fallback to TTS
      await speakText(text)
    }
  }, [audioEnabled, avatarLoaded, applyBlendShapesToAvatar, speakText])

  // Send message for text chat
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    console.log('💬 TEXT: Sending message:', message.substring(0, 50))

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          childId,
          accessCode,
          mode: 'text',
          childName: childInfo.name,
          childAge: childInfo.age
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('💬 TEXT: API error response:', response.status, errorText)
        throw new Error(`Text chat error: ${response.status}`)
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('💬 TEXT: Non-JSON response received:', contentType, responseText.substring(0, 200))
        throw new Error('Invalid response format')
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('💬 TEXT: JSON parsing failed:', jsonError)
        throw new Error('Failed to parse response')
      }
      
      if (!data?.text) {
        console.error('💬 TEXT: Invalid response data:', data)
        throw new Error('Invalid response')
      }
      
      console.log('💬 TEXT: Response from', data.model || 'API')
      
      const avatarMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'avatar',
        timestamp: new Date(),
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, avatarMessage])
      
      // Audio playback
      if (avatarLoaded && audioEnabled && data.text) {
        if (data.audioUrl) {
          console.log('💬 TEXT: Using Gemini audio')
          await playAudioWithLipSync(data.audioUrl, data.text)
        } else {
          console.log('💬 TEXT: Using browser TTS')
          await speakText(data.text)
        }
      }

    } catch (error) {
      console.error('Text chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble right now. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      if (avatarLoaded && audioEnabled) {
        await speakText(errorMessage.text)
      }
    } finally {
      setIsLoading(false)
    }
  }, [childId, accessCode, isLoading, onMessageSent, avatarLoaded, audioEnabled, playAudioWithLipSync, speakText])

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">💬 Text Chat</h3>
            <p className="text-xs text-gray-600">Using Gemini + TTS</p>
          </div>
          
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Avatar */}
        <div className="w-1/2 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="w-full h-full max-w-md">
            <SimpleAvatarViewer
              avatarUrl={avatarUrl}
              onModelLoad={handleAvatarLoad}
              onModelError={handleAvatarError}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Chat */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm font-medium text-gray-700">Start typing to chat!</p>
                <p className="text-xs text-gray-500">Your avatar will speak the responses</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'child' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'child'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border'
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border px-3 py-2 rounded-lg">
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 bg-white border-t">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
                disabled={isLoading || isSpeaking}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || isSpeaking}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
