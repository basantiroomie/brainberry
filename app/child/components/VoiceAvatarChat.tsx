'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Mic, Volume2, VolumeX, Send } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  audioUrl?: string
}

interface VoiceAvatarChatProps {
  avatarUrl: string
  childId?: string
  accessCode?: string
  onMessageSent?: (message: string) => void
}

export const VoiceAvatarChat: React.FC<VoiceAvatarChatProps> = ({
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
  const [isListening, setIsListening] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('🎤 Speech recognition not supported in this browser')
      return
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onstart = () => {
          setIsListening(true)
          console.log('🎤 Voice recognition started')
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
          console.log('🎤 Voice recognition ended')
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('🎤 Speech recognition error:', event.error)
          setIsListening(false)
          
          // Show user-friendly error message
          if (event.error === 'no-speech') {
            console.log('🎤 No speech detected, please try again')
          } else if (event.error === 'network') {
            console.error('🎤 Network error in speech recognition')
          }
        }
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('')
          
          console.log('🎤 Speech recognition result:', transcript, 'isFinal:', event.results[0].isFinal)
          
          if (event.results[0].isFinal) {
            setInputMessage(transcript)
            setIsListening(false)
            if (transcript.trim() && transcript.trim().length > 1) {
              // Send voice message
              sendVoiceMessage(transcript.trim())
            } else {
              console.warn('🎤 Speech too short, ignoring:', transcript)
            }
          }
        }
      }
    } catch (error) {
      console.error('🎤 Failed to initialize speech recognition:', error)
    }
  }, [])

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
    console.log('✅ Voice Chat: Avatar loaded successfully')
  }, [])

  const handleAvatarError = useCallback((error: any) => {
    console.error('❌ Voice Chat: Avatar loading error:', error)
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
        console.log('🔊 Voice TTS Started:', text.substring(0, 50))
      }

      utterance.onend = () => {
        console.log('🔊 Voice TTS Finished')
        setIsSpeaking(false)
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('🔊 Voice TTS Error:', event.error)
        setIsSpeaking(false)
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }, [audioEnabled, isSpeaking, applyBlendShapesToAvatar])

  // Send voice message
  const sendVoiceMessage = useCallback(async (message: string) => {
    if (!message || !message.trim() || isLoading) {
      console.warn('🎤 VOICE: Skipping empty or invalid message:', { message, isLoading })
      return
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length < 2) {
      console.warn('🎤 VOICE: Message too short, skipping:', trimmedMessage)
      return
    }

    console.log('🎤 VOICE: Sending message:', trimmedMessage.substring(0, 50))

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedMessage,
      sender: 'child',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    onMessageSent?.(trimmedMessage)

    try {
      const response = await fetch('/api/chat/voice-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          childId,
          accessCode,
          mode: 'voice'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🎤 VOICE: API error response:', response.status, errorText)
        throw new Error(`Voice chat error: ${response.status}`)
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('🎤 VOICE: Non-JSON response received:', contentType, responseText.substring(0, 200))
        throw new Error('Invalid response format')
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('🎤 VOICE: JSON parsing failed:', jsonError)
        throw new Error('Failed to parse response')
      }
      
      if (!data?.text) {
        console.error('🎤 VOICE: Invalid response data:', data)
        throw new Error('Invalid response')
      }
      
      console.log('🎤 VOICE: Response from', data.model || 'Gemini Live')
      
      const avatarMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'avatar',
        timestamp: new Date(),
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, avatarMessage])
      
      // Always use browser TTS for voice mode to ensure consistency
      if (avatarLoaded && audioEnabled && data.text) {
        console.log('🎤 VOICE: Using browser TTS for voice response')
        await speakText(data.text)
      }

    } catch (error) {
      console.error('Voice chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I couldn't hear you clearly. Can you try speaking again?",
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
  }, [childId, accessCode, isLoading, onMessageSent, avatarLoaded, audioEnabled, speakText])

  // Start voice recognition
  const startVoiceRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn('🎤 Speech recognition not available')
      return
    }
    
    if (isListening) {
      console.log('🎤 Already listening, ignoring request')
      return
    }

    try {
      console.log('🎤 Starting voice recognition')
      recognitionRef.current.start()
    } catch (error) {
      console.error('🎤 Failed to start voice recognition:', error)
      setIsListening(false)
    }
  }, [isListening])

  // Form submission for typed messages in voice mode
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendVoiceMessage(inputMessage.trim())
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">🎤 Voice Chat</h3>
            <p className="text-xs text-gray-600">Using Gemini Live AI</p>
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
                <div className="text-3xl mb-2">🎤</div>
                <p className="text-sm font-medium text-gray-700">Click the mic to talk!</p>
                <p className="text-xs text-gray-500">Or type a message below</p>
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
                      ? 'bg-purple-500 text-white'
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
                    <span className="text-xs text-gray-500">Listening...</span>
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
                value={isListening ? 'Listening...' : inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Click mic to speak or type here..."
                disabled={isListening || isLoading || isSpeaking}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 text-sm"
              />
              {inputMessage.trim() ? (
                <button
                  type="submit"
                  disabled={isLoading || isSpeaking}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 transition-colors"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  onClick={startVoiceRecognition}
                  disabled={isLoading || isSpeaking || isListening}
                  className={`px-4 py-2 text-white rounded-lg disabled:bg-gray-300 transition-colors ${
                    isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  <Mic size={16} />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
